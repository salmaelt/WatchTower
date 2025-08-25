using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;
using WatchtowerApi.Domain;

namespace WatchtowerApi.Infrastructure.Repositories;

public class ReportRepository : IReportRepository
{
    private readonly AppDbContext _context; 
    private readonly GeometryFactory _geometryFactory;

    public ReportRepository(AppDbContext context) 
    {
        _context = context;
        _geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);
    }

    public async Task<Report> CreateAsync(long userId, string type, string description, double longitude, double latitude, DateTime? occurredAt = null)
    {
        Point location = _geometryFactory.CreatePoint(new Coordinate(longitude, latitude));
        
        var report = new Report
        {
            UserId = userId,
            Type = type,
            Description = description,
            Location = location,
            OccurredAt = occurredAt?.ToUniversalTime() ?? DateTimeOffset.UtcNow,
            Status = "open"
        };

        _context.Reports.Add(report);
        await _context.SaveChangesAsync();
        
        return report;
    }

    
    public async Task<Report?> GetByIdAsync(long id)
    {
        return await GetByIdInternalAsync(id);
    }

    public async Task<Report> UpdateAsync(long id, string description)
    {
        return await UpdateInternalAsync(id, description);
    }

    public async Task DeleteAsync(long id)
    {
        await DeleteInternalAsync(id);
    }

    public async Task<Report> UpdateStatusAsync(long id, string status)
    {
        return await UpdateStatusInternalAsync(id, status);
    }
    
    private async Task<Report?> GetByIdInternalAsync(long id)
    {
        return await _context.Reports
            .Include(r => r.User)
            .Include(r => r.UpvoteUsers)
                .ThenInclude(ru => ru.User)
            .FirstOrDefaultAsync(r => r.Id == id);
    }

    private async Task<Report> UpdateInternalAsync(long id, string description)
    {
        var report = await _context.Reports.FindAsync(id);
        if (report == null)
            throw new InvalidOperationException($"Report with ID {id} not found");

        report.Description = description;
        report.UpdatedAt = DateTimeOffset.UtcNow;

        await _context.SaveChangesAsync();
        return report;
    }

    private async Task DeleteInternalAsync(long id)
    {
        var report = await _context.Reports.FindAsync(id);
        if (report != null)
        {
            _context.Reports.Remove(report);
            await _context.SaveChangesAsync();
        }
    }

    private async Task<Report> UpdateStatusInternalAsync(long id, string status)
    {
        var report = await _context.Reports.FindAsync(id);
        if (report == null)
            throw new InvalidOperationException($"Report with ID {id} not found");

        report.Status = status;
        report.UpdatedAt = DateTimeOffset.UtcNow;

        await _context.SaveChangesAsync();
        return report;
    }

    public async Task<IEnumerable<Report>> GetByUserIdAsync(long userId)
    {
        return await _context.Reports
            .Include(r => r.User)
            .Include(r => r.UpvoteUsers)
            .Where(r => r.UserId == userId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<Report>> GetReportsAsync(string? type = null, string? status = null)
    {
        var query = _context.Reports
            .Include(r => r.User)
            .Include(r => r.UpvoteUsers)
            .AsQueryable();

        if (!string.IsNullOrEmpty(type))
            query = query.Where(r => r.Type == type);

        if (!string.IsNullOrEmpty(status))
            query = query.Where(r => r.Status == status);

        return await query
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();
    }

     public async Task<IEnumerable<Report>> GetReportsInBoundedBoxAsync(
        double minLongitude, double minLatitude, double maxLongitude, double maxLatitude,
        string? type = null, string? status = null)
    {
        // Normalize just in case (west<=east, south<=north)
        if (minLongitude > maxLongitude) (minLongitude, maxLongitude) = (maxLongitude, minLongitude);
        if (minLatitude  > maxLatitude)  (minLatitude,  maxLatitude)  = (maxLatitude,  minLatitude);

        // Build bbox polygon (X=lng, Y=lat) in WGS84
        var envelope = new Envelope(minLongitude, maxLongitude, minLatitude, maxLatitude);
        var boundingBox = _geometryFactory.ToGeometry(envelope);
        boundingBox.SRID = 4326;

        var query = _context.Reports
            .AsNoTracking()
            .Include(r => r.User)
            .Include(r => r.UpvoteUsers)
            // Include boundary points and keep PostGIS semantics users expect for "bbox"
            .Where(r => r.Location.Intersects(boundingBox));

        if (!string.IsNullOrWhiteSpace(type))
            query = query.Where(r => r.Type == type);

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(r => r.Status == status);

        return await query
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<Report>> GetReportsNearPointAsync(
        double latitude, double longitude, double radiusInKm, 
        string? type = null, string? status = null)
    {
        var point = _geometryFactory.CreatePoint(new Coordinate(longitude, latitude));
        var radiusInMeters = radiusInKm * 1000;

        var query = _context.Reports
            .Include(r => r.User)
            .Include(r => r.UpvoteUsers)
            .Where(r => r.Location.Distance(point) <= radiusInMeters);

        if (!string.IsNullOrEmpty(type))
            query = query.Where(r => r.Type == type);

        if (!string.IsNullOrEmpty(status))
            query = query.Where(r => r.Status == status);

        return await query
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();
    }



    public async Task<long> GetTotalCountAsync(string? type = null, string? status = null)
    {
        var query = _context.Reports.AsQueryable();

        if (!string.IsNullOrEmpty(type))
            query = query.Where(r => r.Type == type);

        if (!string.IsNullOrEmpty(status))
            query = query.Where(r => r.Status == status);

        return await query.CountAsync();
    }

    public async Task<long> GetCountByUserAsync(long userId)
    {
        return await _context.Reports
            .Where(r => r.UserId == userId)
            .CountAsync();
    }

    // UPVOTE METHODS 
    public async Task<Report> UpvoteAsync(long reportId, long userId)
    {
        // Check if the user has already upvoted this post
        ReportUpvote? existingUpvote = await _context.ReportUpvotes
            .FirstOrDefaultAsync(ru => ru.ReportId == reportId && ru.UserId == userId);

        if (existingUpvote == null)
        {
            _context.ReportUpvotes.Add(new ReportUpvote
            {
                ReportId = reportId,
                UserId = userId
            });
            var report = await _context.Reports.FirstAsync(r => r.Id == reportId);
            report.Upvotes += 1;
            await _context.SaveChangesAsync();
            return report;
        }
        else
        {
            return await _context.Reports.FirstAsync(r => r.Id == reportId);
        }
    }

    public async Task<Report> RemoveUpvoteAsync(long reportId, long userId)
    {
        var upvote = await _context.ReportUpvotes
            .FirstOrDefaultAsync(ru => ru.ReportId == reportId && ru.UserId == userId);

        if (upvote != null)
        {
            _context.ReportUpvotes.Remove(upvote);
            var report = await _context.Reports.FirstAsync(r => r.Id == reportId);
            report.Upvotes -= 1;
            await _context.SaveChangesAsync();
            return report;
        }
        else
        {
            return await _context.Reports.FirstAsync(r => r.Id == reportId);
        }
    }
}