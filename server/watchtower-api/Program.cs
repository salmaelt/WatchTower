//Program.cs
using Microsoft.EntityFrameworkCore;
using WatchtowerApi.Infrastructure;

// Builder instance for making the web app
var builder = WebApplication.CreateBuilder(args);

// Controllers + Swagger
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// EF Core: PostgreSQL + PostGIS (NetTopologySuite), sets up database integration
var conn = builder.Configuration.GetConnectionString("Default");
if (string.IsNullOrWhiteSpace(conn))
{
    throw new InvalidOperationException("Unable to read connection string");
}
builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseNpgsql(
        conn,
        npg => npg.UseNetTopologySuite()          // <-- enables geometry(Point,4326)
    )
);

// Cors Setup for React with Vite frontend.
builder.Services.AddCors(o =>
{
    o.AddDefaultPolicy(p =>
        p.WithOrigins("http://localhost:5173")    // Vite default
         .AllowAnyHeader()
         .AllowAnyMethod());
});

// Construct Web App from above builder instance
var app = builder.Build();

// Middleware For development only
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// General Middleware
app.UseHttpsRedirection();
app.UseCors();     // must be before MapControllers if you want it to apply to all endpoints
// (Add auth later) app.UseAuthentication();
// (Add auth later) app.UseAuthorization();

// Load Controllers
app.MapControllers();

// Run the backend
app.Run();
