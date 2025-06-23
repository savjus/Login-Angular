import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface Note{
  id:number;
  content: string;
  editing?:boolean;
}

@Component({
  selector: 'app-dashboard',
  imports: [FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard {
  userName = localStorage.getItem('username');
  notes: Note[] = [];
  newNote: string = '';
  nextId: number = 1;

  addNote(){
    if(this.newNote.trim()){
      this.notes.push({id: this.nextId++,content: this.newNote});
      this.newNote = '';
    }
  }

  deleteNote(id: number){
    this.notes = this.notes.filter(note => note.id !== id);
  }
  editNote(note: Note){
    note.editing = true;
  }
  
  saveNote(note: Note){
    note.editing = false;
  }
}
