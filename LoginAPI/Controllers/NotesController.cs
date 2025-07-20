using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("[controller]")]
public class NotesController : ControllerBase
{
  private readonly AppDbContext _db;
  public NotesController(AppDbContext db) { _db = db; }

  [HttpGet("{username}")]
  public IActionResult GetNotes(string username)
  {
    return Ok(_db.Notes.Where(n => n.Username == username).ToList());
  }

  [HttpPost]
  public IActionResult AddNote([FromBody] Note note)
  {
    _db.Notes.Add(note);
    _db.SaveChanges();
    return Ok(note);
  }

  [HttpPut("{id}")]
  public IActionResult UpdateNote(int id, [FromBody] Note note)
  {
    var existing = _db.Notes.Find(id);
    if (existing == null) return NotFound();
    existing.Content = note.Content;
    return Ok(existing);
  }

  [HttpDelete("{id}")]
  public IActionResult DeleteNote(int id)
  {
    var existing = _db.Notes.Find(id);
    if (existing == null) return NotFound();
    _db.Notes.Remove(existing);
    _db.SaveChanges();
    return Ok();
  }

}