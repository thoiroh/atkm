import { AfterViewInit, Component, OnInit } from '@angular/core';

@Component({
  selector: 'atk-login',
  imports: [],
  template: `
    <div class="login-container">
      <div class="login-box">
        <div class="login-logo">
          <svg height="48" viewBox="0 0 32 32" version="1.1" width="48">
            <path fill="#fff" d="M20.32,22.66l-4.27-10.64-.06.1c-1.73,4.18-3.17,8.51-4.92,12.68-.24.61-.51,1-1.26.89-.63-.04-1.42.04-2.05-.04-.65-.08-1.04-.87-.75-1.44L14.58,4.09c.49-1.26,2.54-.95,2.95.22,2.34,6.34,5.04,12.57,7.25,18.95.28.79.59,1.38-.2,2.03-.65.53-1.22.28-1.97.39-2.05-.1-4.21.12-6.24,0-1.26-.08-1.44-1.1-1.36-2.15.02-.28.14-.55.37-.71.04-.04.3-.16.35-.16,0,0,4.61,0,4.61,0Z"/>
          </svg>
        </div>

        <h1 class="login-title">Connexion à ATK AI</h1>

        <form class="login-form" (submit)="handleLogin($event)">
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email"
                   id="email"
                   class="form-input"
                   placeholder="you@example.com"
                   required />
          </div>

          <div class="form-group">
            <label for="password">Mot de passe</label>
            <input type="password"
                   id="password"
                   class="form-input"
                   placeholder="••••••••"
                   required />
          </div>

          <button type="submit" class="login-button">
            Se connecter
          </button>
        </form>

        <div class="login-footer">
          <a href="#" class="login-link">Mot de passe oublié ?</a>
          <span class="separator">•</span>
          <a href="#" class="login-link">Créer un compte</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .login-box {
      background: var(--color-canvas-subtle);
      border: 1px solid var(--color-border-default);
      border-radius: 12px;
      padding: 40px;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    }

    .login-logo {
      text-align: center;
      margin-bottom: 24px;
    }

    .login-title {
      text-align: center;
      color: var(--color-fg-default);
      margin-bottom: 32px;
      font-size: 24px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      color: var(--color-fg-default);
      margin-bottom: 8px;
      font-size: 14px;
      font-weight: 500;
    }

    .form-input {
      width: 100%;
      padding: 10px 12px;
      background: var(--color-canvas-default);
      border: 1px solid var(--color-border-default);
      border-radius: 6px;
      color: var(--color-fg-default);
      font-size: 14px;
    }

    .form-input:focus {
      outline: none;
      border-color: var(--color-accent-emphasis);
      box-shadow: 0 0 0 3px rgba(31, 111, 235, 0.1);
    }

    .login-button {
      width: 100%;
      padding: 12px;
      background: var(--color-success-emphasis);
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
    }

    .login-button:hover {
      background: #2ea043;
    }

    .login-footer {
      text-align: center;
      margin-top: 24px;
      color: var(--color-fg-muted);
      font-size: 14px;
    }

    .login-link {
      color: var(--color-accent-fg);
      text-decoration: none;
    }

    .login-link:hover {
      text-decoration: underline;
    }

    .separator {
      margin: 0 8px;
      color: var(--color-fg-muted);
    }
  `]
})
export class LoginComponent implements OnInit, AfterViewInit {

  ngOnInit(): void {
    console.log('Login component initialized');
  }

  ngAfterViewInit(): void {
    console.log('Login view initialized');
  }

  handleLogin(event: Event): void {
    event.preventDefault();
    console.log('Login form submitted');
    // Implémenter la logique de connexion
  }
}
