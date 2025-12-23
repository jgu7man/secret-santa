import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MetaService } from './services/meta.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  title = 'secret-santa';

  constructor(private metaService: MetaService) {}

  ngOnInit(): void {
    // Set default meta tags on app initialization
    this.metaService.resetToDefault();
  }
}
