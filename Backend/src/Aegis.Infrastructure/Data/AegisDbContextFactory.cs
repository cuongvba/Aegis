using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Aegis.Infrastructure.Data
{
    public class AegisDbContextFactory : IDesignTimeDbContextFactory<AegisDbContext>
    {
        public AegisDbContext CreateDbContext(string[] args)
        {
            var optionsBuilder = new DbContextOptionsBuilder<AegisDbContext>();
            var connStr = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection") 
                          ?? "Host=localhost;Database=aegis;Username=postgres;Password=postgres_aegis_secure_pass_2026";
            optionsBuilder.UseNpgsql(connStr);
            return new AegisDbContext(optionsBuilder.Options);
        }
    }
}
