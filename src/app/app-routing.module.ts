import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ServerListComponent } from './server-list/server-list.component';

const routes: Routes = [
  { path: '' , redirectTo: '/server-list' , pathMatch: 'full'},
  { path: 'server-list', component: ServerListComponent},

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
