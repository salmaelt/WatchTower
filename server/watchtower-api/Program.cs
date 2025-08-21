//Program.cs
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using WatchtowerApi.Infrastructure;
using WatchtowerApi.Infrastructure.Auth;
using WatchtowerApi.Domain;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Text;
using System.Security.Claims;
using WatchtowerApi.Infrastructure.Repositories;
using IUserAuthService = WatchtowerApi.Infrastructure.Auth.IUserAuthService;


// Builder instance for making the web app
var builder = WebApplication.CreateBuilder(args);

// Controllers + Swagger
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();


// Swagger
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "WatchTower API", Version = "v1" });

    var bearer = new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Paste your JWT and click Authorize."
    };

    c.AddSecurityDefinition("Bearer", bearer);
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        { bearer, Array.Empty<string>() }
    });
});

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
JwtSecurityTokenHandler.DefaultMapInboundClaims = false;
var issuer   = builder.Configuration["Jwt:Issuer"];
var audience = builder.Configuration["Jwt:Audience"];
var key = builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(issuer) ||
    string.IsNullOrWhiteSpace(audience) ||
    string.IsNullOrWhiteSpace(key))
{
    throw new InvalidOperationException("JWT configuration missing (Jwt:Issuer/Audience/Key).");
}
builder.Services.AddScoped<IUserAuthService, JwtUserAuthService>();
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
builder.Services.AddAuthorization();

// Cors Setup for React with Vite frontend.
builder.Services.AddCors(o =>
{
    o.AddDefaultPolicy(p =>
        p.WithOrigins("http://localhost:5173")    // Vite default
         .AllowAnyHeader()
         .AllowAnyMethod());
});

builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<ICommentRepository, CommentRepository>();
builder.Services.AddScoped<IReportRepository, ReportRepository>();


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
app.UseAuthorization();

// Load Controllers
app.MapControllers();

// DB Health check endpoint
app.MapGet("/db/health", async (AppDbContext db) =>
    Results.Ok(new { connected = await db.Database.CanConnectAsync() }));

// Auth check endpoint for getting a token (DB independent)
app.MapGet("/auth/dev-token", ([FromServices] IUserAuthService auth, long uid, string name, bool admin = false) =>
{
    var user = new User { Id = uid, Username = name, IsAdmin = admin, PasswordHash = "" };
    var token = auth.GenerateJwtToken(user);
    return Results.Ok(new { token });
}).AllowAnonymous();

// Auth check endpoint for verifying token works (DB independent)
app.MapGet("/whoami", [Authorize] (ClaimsPrincipal user) =>
{
    return Results.Ok(new
    {
        sub = user.FindFirst(JwtRegisteredClaimNames.Sub)?.Value,
        name = user.Identity?.Name,
        roles = user.FindAll(ClaimTypes.Role).Select(r => r.Value).ToArray()
    });
});

// Run the backend
app.Run();
