using Microsoft.AspNetCore.Mvc;

namespace Login;
[ApiController]
[Route("[controller]")]
public class LoginController : ControllerBase
{
    [HttpPost]
    public IActionResult Login([FromBody] LoginRequest request)
    {
        // Replace with real user validation and hashed passwords
        if (request.Username == "admin" && request.Password == "admin")
        {
            // Return a fake token for demonstration
            return Ok(new { token = "your-jwt-token" });
        }
        return Unauthorized(new { message = "Invalid credentials" });
    }
}

public class LoginRequest
{
    public required string Username { get; set; }
    public required string Password { get; set; }
}