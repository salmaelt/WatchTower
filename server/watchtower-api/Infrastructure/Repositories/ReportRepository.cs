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

    public async Task<Report> CreateAsync(int userId, string type, string description, double latitude, double longitude, DateTime? occurredAt = null)
    {
        var location = _geometryFactory.CreatePoint(new Coordinate(longitude, latitude));
        
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

    
    public async Task<Report?> GetByIdAsync(int id)
    {
        return await GetByIdInternalAsync((long)id);
    }

    public async Task<Report> UpdateAsync(int id, string type, string description, string status)
    {
        return await UpdateInternalAsync((long)id, type, description, status);
    }

    public async Task DeleteAsync(int id)
    {
        await DeleteInternalAsync((long)id);
    }

    public async Task<Report> UpdateStatusAsync(int id, string status)
    {
        return await UpdateStatusInternalAsync((long)id, status);
    }

    public async Task<Report> UpdateUpvotesAsync(int id, int upvotes)
    {
        return await UpdateUpvotesInternalAsync((long)id, upvotes);
    }

    
    private async Task<Report?> GetByIdInternalAsync(long id)
    {
        return await _context.Reports
            .Include(r => r.User)
            .Include(r => r.UpvoteUsers)
                .ThenInclude(ru => ru.User)
            .FirstOrDefaultAsync(r => r.Id == id);
    }

    private async Task<Report> UpdateInternalAsync(long id, string type, string description, string status)
    {
        var report = await _context.Reports.FindAsync(id);
        if (report == null)
            throw new InvalidOperationException($"Report with ID {id} not found");

        report.Type = type;
        report.Description = description;
        report.Status = status;
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

    private async Task<Report> UpdateUpvotesInternalAsync(long id, int upvotes)
    {
        var report = await _context.Reports.FindAsync(id);
        if (report == null)
            throw new InvalidOperationException($"Report with ID {id} not found");

        report.Upvotes = upvotes;
        report.UpdatedAt = DateTimeOffset.UtcNow;

        await _context.SaveChangesAsync();
        return report;
    }

    public async Task<IEnumerable<Report>> GetByUserIdAsync(int userId)
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
        double minLatitude, double minLongitude, double maxLatitude, double maxLongitude, 
        string? type = null, string? status = null)
    {
        // Create bounding box geometry
        var envelope = new Envelope(minLongitude, maxLongitude, minLatitude, maxLatitude);
        var boundingBox = _geometryFactory.ToGeometry(envelope);

        var query = _context.Reports
            .Include(r => r.User)
            .Include(r => r.UpvoteUsers)
            .Where(r => r.Location.Within(boundingBox));

        if (!string.IsNullOrEmpty(type))
            query = query.Where(r => r.Type == type);

        if (!string.IsNullOrEmpty(status))
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



    public async Task<int> GetTotalCountAsync(string? type = null, string? status = null)
    {
        var query = _context.Reports.AsQueryable();

        if (!string.IsNullOrEmpty(type))
            query = query.Where(r => r.Type == type);

        if (!string.IsNullOrEmpty(status))
            query = query.Where(r => r.Status == status);

        return await query.CountAsync();
    }

    public async Task<int> GetCountByUserAsync(int userId)
    {
        return await _context.Reports
            .Where(r => r.UserId == userId)
            .CountAsync();
    }

    // UPVOTE METHODS 
    public async Task UpvoteAsync(long reportId, int userId)
    {
        
        var existingUpvote = await _context.ReportUpvotes
            .FirstOrDefaultAsync(ru => ru.ReportId == reportId && ru.UserId == userId);
        
        if (existingUpvote == null)
        {
            _context.ReportUpvotes.Add(new ReportUpvote 
            { 
                ReportId = reportId, 
                UserId = userId 
            });
            await _context.SaveChangesAsync();
        }
    }

    public async Task RemoveUpvoteAsync(long reportId, int userId)
    {
        var upvote = await _context.ReportUpvotes
            .FirstOrDefaultAsync(ru => ru.ReportId == reportId && ru.UserId == userId);
        
        if (upvote != null)
        {
            _context.ReportUpvotes.Remove(upvote);
            await _context.SaveChangesAsync();
        }
    }
}