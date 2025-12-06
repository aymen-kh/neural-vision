import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('neural-vision');

  constructor() {
    console.log('App initialized. Welcome to Neural Vision!');
    console.log('If you are looking for logs, they will appear here in the Browser Console.');
  }
}
