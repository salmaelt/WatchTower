using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;
using WatchtowerApi.Domain;

namespace WatchtowerApi.Infrastructure
{
    public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
    {
        
    }
}