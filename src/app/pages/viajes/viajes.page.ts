import { Component, OnInit } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Storage } from '@ionic/storage-angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-viajes',
  templateUrl: './viajes.page.html',
  styleUrls: ['./viajes.page.scss'],
})
export class ViajesPage implements OnInit {
  viajes: any[] = [];

  constructor(
    private db: AngularFireDatabase,
    private storage: Storage,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.storage.create(); // Inicializa el almacenamiento
    this.db.list('viajes').valueChanges().subscribe((viajes) => {
      this.viajes = viajes as any[];
    });
  }

  async seleccionarViaje(viaje: any) {
    // Guardar el viaje seleccionado en el almacenamiento local
    await this.storage.set('viaje_actual', viaje);
    // Redirigir a la página de "viaje-actual"
    this.router.navigate(['/viaje-actual']);
  }
}
