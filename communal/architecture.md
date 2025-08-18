# Architecture

Three-tier application structure with tight DB backend integration.

## Backend
	.NET + EF Core + PostgreSQL + PostGIS

- .NET:  web api backend written in C# with controllers, repository pattern etc
- EF CORE: ORM which mounts database directly into C#, reducing complexity of writing queries (LINQ) and enabling scheme changes
- PostgreSQL: Relational database for storing events, users and various other information
- PostGIS: Dependency for Postgres which allows geographic types, spatial indexing and distance functions

## Comms

↕ REST APIs using JSON and possibly GeoJSON 

## Frontend

    JS/TS + React + Vite + Leaflet + Bootstrap

- JavaScript: (preferably TypeScript for speed / security) 
- React: Frontend framework for managing state/hooks etc
- Vite: Lightweight Build tool for React projects
- Leaflet (react-leaflet): Package  for building map features (map engine) which is integrated well with React, (google maps api costs money, but is alternative)
- CSS: Styling with CSS and other styling frameworks such as possibly Bootstrap or Tailwind