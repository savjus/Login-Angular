import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Notes, Note } from './notes';

@Component({
  selector: 'app-dashboard',
  imports: [FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  providers: [Notes]
})
export class Dashboard {
  userName = localStorage.getItem('username') ?? '';
  notes: Note[] = [];
  newNote: string = '';

  constructor(private notesService: Notes){
    this.loadNotes();
  }

  loadNotes(){
    this.notesService.getNotes(this.userName)
      .subscribe(n => this.notes = n);
  }

  addNote(){
    if(this.newNote.trim()){
      this.notesService.addNote({content: this.newNote, username: this.userName})
      .subscribe(n => {
        this.notes.push(n);
        this.newNote = '';
      });
    }
  }

  deleteNote(id: number){
    this.notesService.deleteNote(id)
      .subscribe(() => {
        this.notes = this.notes.filter(n => n.id !== id);
      });
  }

  editNote(note: Note){
    note.editing = true;
  }

  saveNote(note: Note){
    note.editing = false;
    this.notesService.updateNote(note).subscribe();
  }
}
