using WatchtowerApi.Domain;

namespace WatchtowerApi.Infrastructure.Repositories;

public interface IReportRepository
{
    Task<Report> CreateAsync(int userId, string type, string description, double latitude, double longitude, DateTime? occurredAt = null);
    Task<Report?> GetByIdAsync(int id);
    Task<IEnumerable<Report>> GetByUserIdAsync(int userId);
    Task<IEnumerable<Report>> GetReportsAsync(string? type = null, string? status = null);
    Task<IEnumerable<Report>> GetReportsInBoundedBoxAsync(double minLatitude, double minLongitude, double maxLatitude, double maxLongitude, string? type = null, string? status = null);
    Task<IEnumerable<Report>> GetReportsNearPointAsync(double latitude, double longitude, double radiusInKm, string? type = null, string? status = null);
    Task<Report> UpdateAsync(int id, string type, string description, string status);
    Task DeleteAsync(int id);
    Task<Report> UpdateStatusAsync(int id, string status);
    Task<Report> UpdateUpvotesAsync(int id, int upvotes);
    Task<int> GetTotalCountAsync(string? type = null, string? status = null);
    Task<int> GetCountByUserAsync(int userId);
    Task UpvoteAsync(long reportId, int userId);
    Task RemoveUpvoteAsync(long reportId, int userId);
}