import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Note{
  id: number;
  content: string;
  username: string;
  editing?: boolean;
}

@Injectable({providedIn: 'root'})
export class Notes {

  apiUrl = 'http://localhost:5184/notes';

  constructor(private http: HttpClient) { }


  getNotes(username: string): Observable<Note[]>{
    return this.http.get<Note[]>(`${this.apiUrl}/${username}`);
  }
  addNote(note: Partial<Note>): Observable<Note>{
    return this.http.post<Note>(this.apiUrl,note);
  }
  updateNote(note: Note): Observable<Note>{
    return this.http.put<Note>(`${this.apiUrl}/${note.id}`,note);
  }
  deleteNote(id: number): Observable<any>{
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
