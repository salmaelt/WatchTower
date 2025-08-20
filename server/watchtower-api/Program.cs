//Program.cs
using Microsoft.EntityFrameworkCore;
using WatchtowerApi.Infrastructure;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

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

// Authentication Setup with JWTs
var issuer   = builder.Configuration["Jwt:Issuer"];
var audience = builder.Configuration["Jwt:Audience"];
var key = builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(issuer) ||
    string.IsNullOrWhiteSpace(audience) ||
    string.IsNullOrWhiteSpace(key))
{
    throw new InvalidOperationException("JWT configuration missing (Jwt:Issuer/Audience/Key).");
}
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateIssuerSigningKey = true,

                ValidIssuer = issuer,
                ValidAudience = audience,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),

                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            };
});

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
app.UseAuthentication();
// (Add auth later) app.UseAuthorization();

// Load Controllers
app.MapControllers();

// DB Health check endpoint
app.MapGet("/db/health", async (AppDbContext db) =>
    Results.Ok(new { connected = await db.Database.CanConnectAsync() }));

// Run the backend
app.Run();
