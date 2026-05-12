import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../services/auth.service';

@Component({
    selector: 'app-test',
    standalone: true,
    template: `
        <div style="padding: 20px;">
            <h2>Test Page</h2>
            <button (click)="testAPI()">Test API</button>
            <pre>{{ result }}</pre>
        </div>
    `
})
export class TestComponent {
    result = 'Click the button';

    constructor(private http: HttpClient, private auth: AuthService) {}

    testAPI() {
        this.result = 'Loading...';
        const token = this.auth.getToken();
        this.http.get('/api/vs').subscribe({
            next: (res) => this.result = JSON.stringify(res, null, 2),
            error: (err) => this.result = 'Error: ' + err.message
        });
    }
}