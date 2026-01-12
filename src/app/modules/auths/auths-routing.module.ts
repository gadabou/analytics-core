import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LoginComponent } from './login/login.component';


const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  // {
  //   path: 'login',
  //   component: LoginComponent,
  //   canActivate: [LogoutAccessGuard],
  //   data: {
  //     href: 'auths/login',
  //     title: 'User login',
  //     access: ['_public']
  //   },
  // },
  // {
  //   path: 'change-default-password',
  //   component: ChangeDefaultPasswordComponent,
  //   canActivate: [LoginAccessGuard],
  //   data: {
  //     href: 'auths/change-default-password',
  //     title: 'Change Default Password',
  //     access: ['must_change_default_password']
  //   },
  // },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AuthsRoutingModule { }
