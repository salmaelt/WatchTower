
# Presentation Planning
## Specification
Prepare a 10-12 minute presentation to include the following topics.

❗ You are unlikely to have time to include all the recommended details in the presentation but be prepared to take further questions on these topics.

1. Solution Research & Planning
2. Planning & Delivery
3. MVP Demonstration
4. Tools & Technologies
5. Significant Wins
6. Challenges and Solutions
7. Future Features

### Q&A
Immediately after your presentation, there will be a 5-10 minute Q&A facilitated by the event host (a La Fosse Academy staff member).

During this Q&A aim to give space for each person on your team to speak.
You may like to prepare an appendix to your presentation deck to reference as appropriate during Q&A.
See our Presentation Guide for tips

## What should be covered 

### Problem to be solved + Approach
    - Phone theft in London

### Planning
    - use of api-contracts to reduce friction across the stack
    - clearly defined db schema and erd
    - requirements formally defined for the MVP

### High-level architechture / stack
    - Use of PostGIS
    - Use of .NET
    - Use of React/React-native/typescript

### Backend architechture
    - layered 
    - centralised auth
    - ef core mounted database
    - use of Dtos and models
    - dependency injection
    - request-response flow

### Web frontend 
    - React
    - Component structure

### Mobile frontend
    - React-native

### Data
    - Visualisations, data analytics of crime data
    
# Ideas from GPT

## Specification
Prepare a 10-12 minute presentation covering:

1. **Solution Research & Planning**
2. **Planning & Delivery**
3. **MVP Demonstration**
4. **Tools & Technologies**
5. **Significant Wins**
6. **Challenges and Solutions**
7. **Future Features**

*Q&A (5-10 min) follows. Prepare an appendix for reference and ensure all team members participate.*

---

## 1. Problem to be Solved + Approach
- **Challenge:** Phone theft in London.
- **Approach:** User-centric, cross-platform app for reporting, viewing, and analyzing incidents.

---

## 2. Planning
- **API Contracts:** Defined early to enable parallel development and reduce integration bugs.
- **Documentation:** Consistent docs (`architecture.md`, `db_schema.md`, `requirements.md`) for onboarding and clarity.
- **Requirements:** MVP features and data flows formally specified.

---

## 3. High-Level Architecture / Stack
- **Backend:** ASP.NET Core, EF Core, PostGIS (geospatial queries).
- **Frontend:** React (web), React Native (mobile), TypeScript.
- **Testing:** NUnit, Moq, in-memory database for fast, reliable tests.

---

## 4. Backend Architecture
- **Layered Structure:** Controllers, repositories, domain models for maintainability.
- **Centralized Auth:** JWT tokens for secure access.
- **Dependency Injection:** For testability and loose coupling.
- **DTOs:** Standardized data flow between layers and platforms.
- **Request-Response Flow:** Clear separation of concerns.

---

## 5. Web Frontend
- **React:** Modular component structure.
- **API Integration:** Consumes backend endpoints via contracts.

---

## 6. Mobile Frontend
- **React Native:** Opens directly to map of Greater London.
- **Navigation:** Bottom tab bar for easy page switching.
- **Map Features:** Long-press to report, tap markers for details.

---

## 7. Data
- **Visualizations:** Crime data analytics and mapping.
- **Future:** Predictive mapping, deeper insights.

---

## Significant Wins
- **Layered Architecture:** Easier maintenance and scaling.
- **Reusable DTOs:** Consistency across web, mobile, and backend.
- **Automated Testing:** Full suite for backend reliability.

---

## Challenges & Solutions
- **Geospatial Data:** NetTopologySuite + PostGIS integration.
- **Mobile Navigation:** Tab navigation for better UX.
- **Validation:** Custom property setters enforce business rules.

---

## Future Features
- **Push Notifications:** Real-time alerts for nearby thefts.
- **Advanced Analytics:** Predictive crime mapping.
- **Community Features:** Comments, upvotes, moderation.
- **Admin Dashboard:** For law enforcement/city officials.

---

## Q&A Preparation
- **Appendix:** Architecture diagrams, API contracts, test coverage.
- **Team Roles:** Highlight contributions in planning, coding, testing, and design.

---