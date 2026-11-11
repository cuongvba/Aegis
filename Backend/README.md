# Aegis Backend (C# .NET 10 Clean Architecture)

Hệ thống được thiết kế theo chuẩn Clean Architecture kết hợp CQRS (MediatR) và tích hợp Gemini AI.

## Cấu trúc thư mục:
- `/src/Aegis.Domain`: Chứa các Entities cốt lõi (QuestionBase, UserQuota). Không phụ thuộc vào bất kỳ thư viện nào.
- `/src/Aegis.Application`: Chứa logic nghiệp vụ (Use Cases, CQRS Handlers).
- `/src/Aegis.Infrastructure`: Chứa kết nối Database (PostgreSQL/Spanner), Redis Cache, và Gemini AI Services.
- `/src/Aegis.API`: Chứa các Minimal APIs Endpoint (Cổng giao tiếp).
