using Microsoft.Extensions.Options;
using Microsoft.SemanticKernel;
using PolicyManagerMCP.Handlers;
using PolicyManagerMCP.Models;
using PolicyManagerMCP.Observability;
using PolicyManagerMCP.Plugins;
using PolicyManagerMCP.Services;
using Polly;

namespace PolicyManagerMCP;

public static class ServiceCollectionExtensions
{
        extension(IServiceCollection services)
        {
            public IServiceCollection AddApplicationServices(IConfiguration configuration)
            {
                services.AddCors(configuration);
                services.AddAiClient(configuration);
                services.AddAiInfrastructure(configuration);
                services.AddKernel(configuration);
                services.AddSingleton<KernelProductChatService>();
                return services;
            }

            private IServiceCollection AddKernel(IConfiguration configuration)
            {
                // services.AddSingleton<Kernel>(sp =>
                // {
                //     var httpClientFactory = sp.GetRequiredService<IHttpClientFactory>();
                //     var aiConfig = sp.GetRequiredService<IOptions<AiModelOptions>>().Value;
                //
                //     var client = httpClientFactory.CreateClient(Constants.AiModelHttpClientName);
                //
                //     return Kernel.CreateBuilder()
                //         .AddOpenAIChatCompletion(
                //             modelId: aiConfig.ModelName,
                //             endpoint: new Uri(aiConfig.BaseUri!),
                //             apiKey: string.IsNullOrWhiteSpace(aiConfig.Token) ? null : aiConfig.Token,
                //             serviceId: "custom-ai",
                //             httpClient: client
                //         )
                //         .Build();
                // });
                services.AddSingleton<Kernel>(sp =>
                {
                    var aiConfig = sp.GetRequiredService<IOptions<AiModelOptions>>().Value;

                    var builder = Kernel.CreateBuilder();
                    builder.AddOllamaChatCompletion(
                            modelId: aiConfig.ModelName,
                            endpoint: new Uri(aiConfig.BaseUri!),
                            serviceId: "ollama"
                        );
                    builder.Services.AddSingleton(sp.GetRequiredService<DummyJsonProductClient>());
                    builder.Plugins.AddFromType<ProductsPlugin>("Products");
                        return builder.Build();
                });
                return services;
            }

            private IServiceCollection AddAiInfrastructure(IConfiguration configuration)
            {
                services
                    .AddOptions<AiModelOptions>()
                    .Bind(configuration.GetSection(AiModelOptions.SectionName))
                    .ValidateDataAnnotations()
                    .Validate(
                        options => Uri.TryCreate(options.BaseUri, UriKind.Absolute, out _),
                        "AiModel:BaseUri must be a valid absolute URI.")
                    .Validate(
                        options => Uri.TryCreate(options.ModelName, UriKind.Absolute, out _),
                        "AiModel:ModelName must be a valid absolute URI.")
                    .ValidateOnStart();
                
                services.AddScoped<ICorrelationContext, CorrelationContext>();

                services.AddTransient<CorrelationIdHandler>();
                services.AddTransient<OptionalAuthorizationHandler>();
                services.AddTransient<RequestResponseLoggingHandler>();
                
                services.AddHttpClient<IAiClient, AiClient>((serviceProvider, client) =>
                    {
                        var options = serviceProvider.GetRequiredService<IOptions<AiModelOptions>>().Value;

                        client.BaseAddress = new Uri(options.BaseUri);
                        client.Timeout = TimeSpan.FromSeconds(options.TimeoutSeconds);

                        client.DefaultRequestHeaders.Accept.Clear();
                        client.DefaultRequestHeaders.Add("Accept", "application/json");
                    })
                    .AddHttpMessageHandler<CorrelationIdHandler>()
                    .AddHttpMessageHandler<OptionalAuthorizationHandler>()
                    .AddHttpMessageHandler<RequestResponseLoggingHandler>()
                    .AddStandardResilienceHandler(resilience =>
                    {
                        // Retry
                        resilience.Retry.MaxRetryAttempts = 2;
                        resilience.Retry.Delay = TimeSpan.FromSeconds(2);
                        resilience.Retry.UseJitter = true;
                        resilience.Retry.BackoffType = DelayBackoffType.Exponential;

                        // Circuit breaker
                        resilience.CircuitBreaker.SamplingDuration = TimeSpan.FromSeconds(60);
                        resilience.CircuitBreaker.FailureRatio = 0.5;
                        resilience.CircuitBreaker.MinimumThroughput = 8;
                        resilience.CircuitBreaker.BreakDuration = TimeSpan.FromSeconds(20);


                        // Optional total timeout
                        resilience.TotalRequestTimeout.Timeout = TimeSpan.FromSeconds(90);

                        // Optional attempt timeout
                        resilience.AttemptTimeout.Timeout = TimeSpan.FromSeconds(30);
                    });

                return services;
            }

            private IServiceCollection AddAiClient(IConfiguration configuration)
            {
                services.AddTransient<OptionalAuthorizationHandler>();
                services.AddHttpClient(Constants.AiModelHttpClientName, client =>
                {
                    client.BaseAddress = new Uri(configuration.GetValue<string>(Constants.AiModelBaseUriKey)!);
                    client.DefaultRequestHeaders.Accept.Clear();
                    client.Timeout = Timeout.InfiniteTimeSpan;
                })
                .AddHttpMessageHandler<OptionalAuthorizationHandler>();
                services.AddScoped<AiService>();
                return services;
            }

            private IServiceCollection AddCors(IConfiguration configuration)
            {
                // CORS
                var corsOrigins = configuration.GetValue<string>(Constants.CorsOrigins)?.Trim().Split(',');
                services.AddCors(options =>
                {
                    options.AddPolicy(Constants.CorsPolicyName, policy =>
                    {
                        policy.WithOrigins(corsOrigins??[])
                            .AllowAnyMethod()
                            .AllowAnyHeader();
                    });
                });
                return services;
            }
        }
}