using WatchtowerApi.Domain;

namespace WatchtowerApi.Infrastructure.Repositories;

public interface IReportRepository
{
    Task<Report> CreateAsync(long userId, string type, string description, double latitude, double longitude, DateTime? occurredAt = null);
    Task<Report?> GetByIdAsync(long id);
    Task<IEnumerable<Report>> GetByUserIdAsync(long userId);
    Task<IEnumerable<Report>> GetReportsAsync(string? type = null, string? status = null);
    Task<IEnumerable<Report>> GetReportsInBoundedBoxAsync(double minLatitude, double minLongitude, double maxLatitude, double maxLongitude, string? type = null, string? status = null);
    Task<IEnumerable<Report>> GetReportsNearPointAsync(double latitude, double longitude, double radiusInKm, string? type = null, string? status = null);
    Task<Report> UpdateAsync(long id, string description);
    Task DeleteAsync(long id);
    Task<Report> UpdateStatusAsync(long id, string status);
    Task<long> GetTotalCountAsync(string? type = null, string? status = null);
    Task<long> GetCountByUserAsync(long userId);

    public Task<Report> UpvoteAsync(long reportId, long userId);
    public Task<Report> RemoveUpvoteAsync(long reportId, long userId);
}