import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { KanbanComponent } from './kanban/kanban.component';


const routes: Routes = [
  // { path: '', redirectTo: 'reports-view', pathMatch: 'full' },
  {
    path: '',
    component: KanbanComponent,
    // canActivate: [LoginAccessGuard],
    data: {
      href: 'reports',
      title: 'RAPPORTS',
      access: ['can_view_reports']
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ModulesRoutingModule { }
