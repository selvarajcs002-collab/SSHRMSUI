import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { catchError, map, delay, tap, switchMap } from 'rxjs/operators';

export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  refreshToken?: string;
  user?: User;
  expiresIn?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'ems_token';
  private readonly USER_KEY = 'ems_user_email'; // using existing key for compatibility

  private currentUserSubject = new BehaviorSubject<User | null>(this.getStoredUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private http: HttpClient) { }

  login(credentials: { email: string, password: string }): Observable<AuthResponse> {
    return this.http.get<any>('/assets/appsettings.json').pipe(
      switchMap(config => {
        const baseUrl = config?.ApiSettings?.BaseUrl || 'http://200.141.4.172:5000';
        const url = `${baseUrl}/api/login`;

        const headers = new HttpHeaders({
          'Accept': '/',
          'Content-Type': 'application/json-patch+json'
        });

        return this.http.post<any>(url, credentials, { headers });
      }),
      map(response => {
        // If the API returns a 200 OK but indicates failure in the body
        if (response && response.status === false) {
          throw new Error(response.message || 'Login failed.');
        }

        // If the API indicates success via an id > 0
        if (response && response.id > 0) {
          const authResult: AuthResponse = {
            success: true,
            // Fallback to a valid token string so AuthGuard works, if real token isn't provided
            token: response.token || response.accessToken || `session-active-${response.id}`,
            user: {
              id: response.id.toString(),
              username: credentials.email.split('@')[0],
              email: credentials.email,
              firstName: 'Admin',
              lastName: 'User'
            }
          };

          this.setSession(authResult);
          return authResult;
        }

        // Fallback to strict token-based check
        const token = typeof response === 'string' ? response : (response?.token || response?.accessToken);

        if (!token) {
          throw new Error(response?.message || 'Invalid response from server.');
        }

        const authResult: AuthResponse = {
          success: true,
          token: token,
          user: {
            id: '1', // Mock user details since API might just return a token
            username: credentials.email.split('@')[0],
            email: credentials.email,
            firstName: 'Admin',
            lastName: 'User'
          }
        };

        this.setSession(authResult);
        return authResult;
      }),
      catchError((error: any) => {
        // If the error was thrown manually from the map operator
        if (error instanceof Error && !(error instanceof HttpErrorResponse)) {
          return throwError(() => error);
        }

        let errorMsg = 'Unable to connect to the login server. Please try again.';
        
        if (error.error?.message) {
          errorMsg = error.error.message;
        } else if (error.error && typeof error.error === 'string') {
          errorMsg = error.error;
        } else if (error.status === 401 || error.status === 400) {
          errorMsg = 'Invalid email or password.';
        }
        
        return throwError(() => new Error(errorMsg));
      })
    );
  }

  logout(): void {
    // Clear local storage
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);

    // Clear subject states
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    return this.hasToken();
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  private setSession(authResult: AuthResponse): void {
    if (authResult.token) {
      localStorage.setItem(this.TOKEN_KEY, authResult.token);
      this.isAuthenticatedSubject.next(true);
    }

    if (authResult.user) {
      localStorage.setItem(this.USER_KEY, authResult.user.email);
      this.currentUserSubject.next(authResult.user);
    }
  }

  private hasToken(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }

  private getStoredUser(): User | null {
    const userEmail = localStorage.getItem(this.USER_KEY);
    if (userEmail) {
      return { id: '1', username: 'admin', email: userEmail, firstName: 'Admin', lastName: 'User' };
    }
    return null;
  }

  // Temporary mock login for UI testing
  private simulateLogin(credentials: any): Observable<AuthResponse> {
    if (credentials.username && credentials.password) {
      return of({
        success: true,
        token: 'mock-jwt-token-12345',
        user: {
          id: '1',
          username: credentials.username,
          email: `${credentials.username}@ems.local`,
          firstName: 'Admin',
          lastName: 'User'
        }
      }).pipe(delay(1500)); // Simulate network delay
    } else {
      return throwError(() => new Error('Invalid username or password')).pipe(delay(1000));
    }
  }
}
