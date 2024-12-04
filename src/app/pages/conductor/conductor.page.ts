import { Component, OnInit } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';

@Component({
  selector: 'app-conductor',
  templateUrl: './conductor.page.html',
  styleUrls: ['./conductor.page.scss'],
})
export class ConductorPage implements OnInit {
  viaje = {
    lugarPartida: '',
    horaPartida: '',
    destino: '',
    precio: 0,
    patente: '',
    asientosDisponibles: 0,
  };
  viajes: any[] = [];

  constructor(private db: AngularFireDatabase) {}

  ngOnInit() {
    // Obtener lista de viajes desde Firebase
    this.db.list('viajes').valueChanges().subscribe((viajes) => {
      this.viajes = viajes as any[];
    });
  }
  mostrarCalendario = false;

  abrirCalendario() {
    this.mostrarCalendario = true;
  }

  cerrarCalendario() {
    this.mostrarCalendario = false;
  }
  crearViaje() {
    // Generar ID único para el viaje
    const viajeId = this.db.createPushId();
    const viajeConductor = {
      ...this.viaje,
      conductorId: 'CONDUCTOR_ID_AQUÍ', // Reemplazar con ID del conductor autenticado
    };

    // Guardar el viaje en Firebase
    this.db.object(`viajes/${viajeId}`).set(viajeConductor).then(() => {
      alert('Viaje creado exitosamente');
      this.viaje = {
        lugarPartida: '',
        horaPartida: '',
        destino: '',
        precio: 0,
        patente: '',
        asientosDisponibles: 0,
      };
    });
  }
}
