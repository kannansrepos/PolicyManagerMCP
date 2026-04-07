using PolicyManagerMCP;
using PolicyManagerMCP.Handlers;
using PolicyManagerMCP.Middlewares;
using PolicyManagerMCP.Observability;
using PolicyManagerMCP.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddApplicationServices(builder.Configuration);
builder.Services.AddHttpClient<DummyJsonProductClient>(client =>
    {
        client.BaseAddress = new Uri("https://dummyjson.com/");
        client.Timeout = TimeSpan.FromSeconds(60);

        client.DefaultRequestHeaders.Clear();
        client.DefaultRequestHeaders.Add("Accept", "application/json");
    })
    .AddHttpMessageHandler<CorrelationIdHandler>()
    .AddHttpMessageHandler<RequestResponseLoggingHandler>()
    .AddStandardResilienceHandler(resilience =>
    {
        resilience.Retry.MaxRetryAttempts = 2;
        resilience.Retry.Delay = TimeSpan.FromSeconds(2);

        resilience.AttemptTimeout.Timeout = TimeSpan.FromSeconds(10);

        resilience.CircuitBreaker.SamplingDuration = TimeSpan.FromSeconds(30);
        resilience.CircuitBreaker.FailureRatio = 0.5;
        resilience.CircuitBreaker.MinimumThroughput = 5;
        resilience.CircuitBreaker.BreakDuration = TimeSpan.FromSeconds(10);
    });
var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors(Constants.CorsPolicyName);
app.UseMiddleware<CorrelationIdMiddleware>();
app.UseAuthorization();
app.MapControllers();

app.Run();
