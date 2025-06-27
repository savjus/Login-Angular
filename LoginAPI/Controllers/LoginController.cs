using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Text;
using System.Security.Claims;
using System.Security.Cryptography;

namespace Login;

[ApiController]
[Route("[controller]")]
public class LoginController : ControllerBase
{
    private readonly string jwtKey = "SOme_MadeuP_Key_lol_Hi!213!This_must_be_256B";
    private readonly AppDbContext _db;

    public LoginController(AppDbContext db)
    {
        _db = db;
    }

    [HttpPost]
    public IActionResult Login([FromBody] LoginRequest request)
    {
        var user = _db.Users.SingleOrDefault(u => u.Username == request.Username);
        if (user != null && BCrypt.Net.BCrypt.Verify(request.Password,user.Password))
        {
            var token = GenerateJwtToken(user.Username);
            return Ok(new { token });
        }
        return Unauthorized(new { message = "Invalid credentials" });
    }

    [HttpPost("signup")]
    public IActionResult Signup([FromBody] LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(new { message = "Username and password required" });

        if (_db.Users.Any(u => u.Username == request.Username))
            return Conflict(new { message = "Username already exists" });

        var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
        var user = new User { Username = request.Username, Password = passwordHash };
        _db.Users.Add(user);
        _db.SaveChanges();
        return Ok(new { success = true });
    }


    private string GenerateJwtToken(string username)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.ASCII.GetBytes(jwtKey);
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[] { new Claim(ClaimTypes.Name, username) }),
            Expires = DateTime.UtcNow.AddMinutes(15),
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }
}

public class LoginRequest
{
    public required string Username { get; set; }
    public required string Password { get; set; }
}