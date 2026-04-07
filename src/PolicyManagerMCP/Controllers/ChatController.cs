using Microsoft.AspNetCore.Mvc;
using PolicyManagerMCP.Models;
using PolicyManagerMCP.Services;

namespace PolicyManagerMCP.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ChatController(
    AiService aiService,
    IAiClient aiClient,
    ILogger<ChatController> logger,
    IConfiguration configuration
): ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Chat([FromBody] ChatRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Prompt))
            return BadRequest("Message cannot be empty.");
        
        // Check Ai Model health
        var isRunning = await aiService.IsAiModelRunningAsync();
        if (!isRunning)
            return StatusCode(503, "Ai Model is not running. Start it first.");
        try
        {
            // var response = await aiService.SendMessageAsync(request.Prompt);
            var response = await aiClient.SendPromptAsync(request.Prompt);
            // return Ok(new ChatResponse { Output = response });
            return Ok(response);
        }
        catch (TaskCanceledException)
        {
            logger.LogWarning("Ai request timed out.");
            return StatusCode(504, $"Request timed out. Try pre-loading model with {configuration.GetValue<string>(Constants.AiModel)}");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error communicating with Ollama.");
            return StatusCode(500, $"Error: {ex.Message}");
        }
    }

}