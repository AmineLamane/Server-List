import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component,OnInit } from '@angular/core';
import { ApiService } from '../api.service';
import { FormBuilder, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';

export interface Site {
  id: number;
  name: string;
  domainName: string;
  ipAddress: string;
  active: boolean;
}
export interface Server {
  id: number;
  name: string;
  ipAddress: string;
  sites: Site[];
}

@Component({
  selector: 'app-server-list',
  templateUrl: './server-list.component.html',
  styleUrls: ['./server-list.component.css'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('500ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})


export class ServerListComponent implements OnInit {

  constructor ( public api: ApiService, private formBuilder:FormBuilder) { }

  servers : Server[] = [];

  expandedServer: Server | null = null;

  dataSource = new MatTableDataSource(this.servers);

  siteform = this.formBuilder.group({
    name: ['', Validators.required],
    domainName: ['', Validators.required],
    active: [false],
  });

  serverform = this.formBuilder.group({
    name: ['', Validators.required],
    ipAddress: ['', Validators.required],
  });
  
  isExpanded(server: Server): boolean {
    return this.expandedServer === server;
  }
  displayedColumns: string[] = ['name', 'ipAddress','actions','expand'];


  ngOnInit(): void {
    // On vérifie si les données n'existe pas en Local Storage
    const serversFromLocalStorage = localStorage.getItem('servers');
    if (serversFromLocalStorage === null) {
    // Les données ne sont pas dans le Local Storage, donc on fait l'appel à l'API
    this.api.getdataservers().subscribe(
      res=>{
        this.servers = res
        this.dataSource = new MatTableDataSource(this.servers);
        localStorage.setItem('servers', JSON.stringify(this.servers)); 
      },
      err=>{
        console.log(err)
      }
    )
    }else{
      // Les données existe dans le local Storage
      this.servers = JSON.parse(serversFromLocalStorage);
      this.dataSource = new MatTableDataSource(this.servers);
    }
    
  }
  
  expandServer(server: Server | null): void {
    this.expandedServer = this.expandedServer === server ? null : server;
  }
  //Changer le statut du site et modifier les servers enregistré en Local Storage
  togglestatusSite(site: Site): void{
    site.active = !site.active
    //Save new servers in localStorage
    localStorage.setItem('servers', JSON.stringify(this.servers)); 
  }
  // Supprimer le site ayant l'index i du serveur étendu
  deleteSite(i: number): void{
    if (this.expandedServer !== null && confirm('Etes-vous sûr de vouloir supprimer le site?')) {
      let serverindex = this.servers.indexOf(this.expandedServer);
      this.servers[serverindex].sites.splice(i,1);
      //Enregister en localStorage
      localStorage.setItem('servers', JSON.stringify(this.servers)); 
    }
  }

  // Delete the site with the index i in the expandedServer
  deleteServer(server: Server): void{
    if (confirm('Etes-vous sûr de vouloir supprimer le serveur?')) {
      let serverindex = this.servers.indexOf(server);
      const newservers = this.servers;
      newservers.splice(serverindex,1)
      this.servers = [...newservers];
      this.dataSource = new MatTableDataSource(this.servers);
       // Save in LocalStorage
      localStorage.setItem('servers', JSON.stringify(this.servers)); 
    }
  }

  addSite(ipAddress : string) : void {
    if (this.expandedServer !== null){
      let serverindex = this.servers.indexOf(this.expandedServer);
      let name = this.siteform.value.name;
      let domainName = this.siteform.value.domainName;
      let active = this.siteform.value.active;
      let lastsite = this.servers[serverindex].sites[this.servers[serverindex].sites.length - 1]
      let lastid = 0
      if(lastsite){
        lastid = lastsite.id
      }
      if(active == null){
        active = false
      }
      if( name && domainName && active !== undefined){
        const servers = this.servers
        servers[serverindex].sites.push({
          id: lastid + 1,
          name : name,
          domainName : domainName,
          ipAddress: ipAddress,
          active: active
        })
        this.servers = [...servers]
      }
      this.siteform.reset()
      localStorage.setItem('servers', JSON.stringify(this.servers)); 
    }
  }
  addServer() : void {
    let name = this.serverform.value.name;
    let ipAddress = this.serverform.value.ipAddress;
    let lastserver = this.servers[this.servers.length - 1]
    if(name && lastserver && ipAddress){
      const servers = this.servers
      servers.push({
        id: lastserver.id + 1,
        name : name,
        ipAddress: ipAddress,
        sites : []
      })
      this.servers = [...servers]
      this.dataSource = new MatTableDataSource(this.servers);
    }
    this.serverform.reset()
    localStorage.setItem('servers', JSON.stringify(this.servers)); 
  }
  
  applyFilter(event: Event) {
    this.expandedServer = null
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filterPredicate = (data: Server, filter: string) => {
      const lowerCaseFilter = filter.toLowerCase();

      // Check if 'sites' property exists and is an array
    if (Array.isArray(data.sites)) {
      for (const site of data.sites) {
        if (
          site.name.toLowerCase().includes(lowerCaseFilter) ||
          site.ipAddress.toLowerCase().includes(lowerCaseFilter) ||
          site.domainName.toLowerCase().includes(lowerCaseFilter)
        ) {
          return true; // Found a match in 'sites' array properties, keep this row
        }
      }
    }

    // Check if 'name' or 'ipAddress' properties match the filter
    if (
      data.name.toLowerCase().includes(lowerCaseFilter) ||
      data.ipAddress.toLowerCase().includes(lowerCaseFilter)
    ) {
      return true; // Found a match in server properties, keep this row
    }

    // If no match is found in 'sites' array properties or 'name'/'ipAddress' properties, exclude this row
    return false;
    };
    //Data is only filtered after updating the filter string
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
}
