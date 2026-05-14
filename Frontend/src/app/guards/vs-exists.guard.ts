import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { VSService } from '../services/vs.service';

@Injectable({
    providedIn: 'root'
})
export class VSExistsGuard implements CanActivate {
    constructor(
        private vsService: VSService,
        private router: Router
    ) {}
    
    canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): Observable<boolean> {
        const folderName = route.params['folderName'];
        
        if (!folderName) {
            this.router.navigate(['/vs']);
            return of(false);
        }
        
        // Verificar se o VS existe
        return this.vsService.getVSDetails(folderName).pipe(
            map(response => {
                if (response.success && response.data) {
                    return true;
                } else {
                    alert('Virtual server not found or has been deleted.');
                    this.router.navigate(['/vs']);
                    return false;
                }
            }),
            catchError((error) => {
                console.error('Error checking VS existence:', error);
                alert('Virtual server not found or has been deleted.');
                this.router.navigate(['/vs']);
                return of(false);
            })
        );
    }
}