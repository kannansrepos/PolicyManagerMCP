using Microsoft.AspNetCore.Mvc;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;
using PolicyManagerMCP.Services;
using PolicyManagerMCP.Stores;

namespace PolicyManagerMCP.Controllers;

[ApiController]
[Route("api/[controller]")]
public class KernelChatController(Kernel kernel,KernelProductChatService chatService) : ControllerBase
{
    const int maxMessages = 20;
    [HttpPost]
    public async Task<IActionResult> Chat([FromBody] string prompt)
    {
        var chatService = kernel.GetRequiredService<IChatCompletionService>();

        var history = new ChatHistory();
        history.AddUserMessage(prompt);

        var result = await chatService.GetChatMessageContentAsync(history);

        return Ok(result.Content);
    }
    [HttpGet("stream")]
    public async Task Stream(
        [FromQuery] string prompt,
        [FromQuery] string sessionId,
        CancellationToken cancellationToken)
    {
        var history = ChatMemoryStore.GetOrCreate(sessionId);

        // 1️⃣ Add system message once
        if (history.Count == 0)
        {
            history.AddSystemMessage("""
                                         You are a helpful assistant.
                                         Remember previous conversation context.
                                         Resolve references like 'it', 'that product', etc.
                                     """);
        }

        // 2️⃣ Add user message
        history.AddUserMessage(prompt);

        // 3️⃣ ✅ TRIM HISTORY HERE
        while (history.Count > maxMessages)
        {
            history.RemoveAt(1); // remove oldest non-system
        }
        var settings = new PromptExecutionSettings
        {
            FunctionChoiceBehavior = FunctionChoiceBehavior.Auto()
        };
        Response.StatusCode = 200;
        Response.ContentType = "text/plain";
        
        // 4️⃣ Call model
        await foreach (var chunk in chatService.StreamAsync(history, settings, cancellationToken))
        {
            await Response.WriteAsync(chunk, cancellationToken);
            await Response.Body.FlushAsync(cancellationToken);
        }
    }
}