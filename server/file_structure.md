# Proposed File Structure

```
server/
└─ watchtower-api/
   ├─ watchtower-api.csproj
   ├─ Program.cs
   ├─ appsettings.json
   ├─ appsettings.Development.json
   ├─ Properties/
   │  └─ launchSettings.json
   │
   ├─ Controllers/                        # Layer 1: HTTP layer (DTOs in/out only)
   │  ├─ AuthController.cs
   │  ├─ ReportsController.cs
   │  └─ CommentsController.cs
   │
   ├─ Contracts/                          # Request/response DTOs
   │  ├─ AuthDtos.cs                      # RegisterRequest, LoginRequest, AuthResponse
   │  ├─ ReportDtos.cs                    # CreateReportRequest, ReportSummaryDto, ReportDetailDto
   │  ├─ CommentDtos.cs                   # CreateCommentRequest, CommentDto
   │  └─ GeoJsonDtos.cs                   # GeoJsonFeature, GeoJsonFeatureCollection
   │
   ├─ Domain/                             # Layer 2: Core model (EF entities + minimal behavior)
   │  ├─ User.cs
   │  ├─ Report.cs                        # includes NetTopologySuite Point (SRID 4326)
   │  └─ Comment.cs
   │
   ├─ Infrastructure/                     # Layer 3: Data access (EF Core + PostGIS)
   │  ├─ AppDbContext.cs                  # HasPostgresExtension("postgis"), DbSets, mappings
   │  └─ Repositories/                    # Interfaces + EF implementations (kept together for speed)
   │     ├─ IUserRepository.cs
   │     ├─ IUserAuthService.cs           # simple auth service interface (JWT issuance)
   │     ├─ IReportRepository.cs
   │     ├─ ICommentRepository.cs
   │     ├─ UserRepository.cs
   │     ├─ ReportRepository.cs           # bbox filter, GiST index usage
   │     ├─ CommentRepository.cs
   │     └─ AuthService.cs                # password hash + JWT creation (lean)
   │
   ├─ Migrations/                         # EF Core migrations (include in git)
   │  ├─ 2025xxxxxx_InitialCreate.cs      # CREATE EXTENSION postgis; tables, FKs, GiST index
   │  └─ AppDbContextModelSnapshot.cs
   │
   ├─ .gitignore
   └─ README.md
```