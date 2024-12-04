import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import * as mapboxgl from 'mapbox-gl';
import { NotificacionesService } from '../../services/notificaciones.service';
import { Storage } from '@ionic/storage-angular';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-role-selection',
  templateUrl: './role-selection.page.html',
  styleUrls: ['./role-selection.page.scss'],
})
export class RoleSelectionPage implements OnInit, OnDestroy {
  userEmail: string | null = null;
  userId: string | null = null;
  map!: mapboxgl.Map;
  viajeActivo: any = null;
  conductorMarker: mapboxgl.Marker | null = null;
  nuevasNotificaciones: boolean = false;
  viajeActivoSubscription: Subscription | undefined;

  constructor(
    private router: Router,
    private afAuth: AngularFireAuth,
    private db: AngularFireDatabase,
    private notificacionesService: NotificacionesService,
    private storage: Storage
  ) {}

  async ngOnInit() {
    await this.storage.create();
    this.afAuth.authState.subscribe(async (user) => {
      if (user) {
        this.userEmail = user.email;
        this.userId = user.uid;
        this.verificarViajeActivo(); // Llama sin parámetro
        this.verificarNotificaciones();
      } else {
        this.userEmail = 'Usuario';
        await this.cargarViajeDesdeStorage();
      }
    });
  }

  ngOnDestroy() {
    if (this.viajeActivoSubscription) {
      this.viajeActivoSubscription.unsubscribe();
    }
  }

  verificarViajeActivo() {
    if (this.userId) {
      this.viajeActivoSubscription = this.db
        .object(`usuarios/${this.userId}/viajeActivo`)
        .valueChanges()
        .subscribe(async (viajeActivo) => {
          if (viajeActivo) {
            this.viajeActivo = viajeActivo;
            await this.guardarViajeEnStorage(viajeActivo);
          } else {
            this.viajeActivo = null;
            await this.storage.remove('viaje_activo');
            this.router.navigate(['/role-selection']);
          }
        });
    }
  }

  async cargarViajeDesdeStorage() {
    const viajeGuardado = await this.storage.get('viaje_activo');
    if (viajeGuardado) {
      this.viajeActivo = viajeGuardado;
    }
  }

  async guardarViajeEnStorage(viaje: any) {
    await this.storage.set('viaje_activo', viaje);
  }

  verificarNotificaciones() {
    if (this.userId) {
      this.db.list(`usuarios/${this.userId}/notificaciones`)
        .valueChanges()
        .subscribe((notificaciones: any[]) => {
          this.nuevasNotificaciones = notificaciones && notificaciones.length > 0;
        });
    }
  }

  async cancelarViaje() {
    if (this.viajeActivo) {
      const viajeId = this.viajeActivo.viajeId;
      const conductorId = this.viajeActivo.conductorId;
      const pasajerosRef = this.db.list(`viajes/${viajeId}/pasajeros`);
      let pasajeroEliminado = false;
      await pasajerosRef.query.once('value', (snapshot) => {
        snapshot.forEach((childSnapshot) => {
          const pasajeroData = childSnapshot.val();
          if (pasajeroData.email === this.userEmail) {
            pasajerosRef.remove(childSnapshot.key!);
            pasajeroEliminado = true;
            return true;
          }
          return false;
        });
      });
      if (pasajeroEliminado) {
        const viajeRef = this.db.object(`viajes/${viajeId}`);
        const pasajerosSnapshot = await pasajerosRef.query.once('value');
        const numeroPasajerosActual = pasajerosSnapshot.numChildren();
        const asientosTotales = this.viajeActivo.asientos;
        await viajeRef.update({
          asientosDisponibles: asientosTotales - numeroPasajerosActual,
        });
      }
      await this.notificacionesService.notificarConductorPasajeroCancelaViaje(viajeId, conductorId, this.userEmail!);
      const userId = (await this.afAuth.currentUser)?.uid;
      if (userId) {
        await this.db.object(`usuarios/${userId}/viajeActivo`).remove();
      }
      const viajeActivoRef = this.db.object(`usuarios/${this.userId}/viajeActivo`);
      await viajeActivoRef.remove();
      await this.storage.remove('viaje_activo');
      this.viajeActivo = null;
      await this.storage.remove('viaje_activo');
    }
  }

  selectConductor() {
    this.router.navigate(['/conductor']);
  }

  selectPasajero() {
    if (this.viajeActivo) {
      alert('Ya tienes un viaje activo. Cancélalo para poder seleccionar otro.');
    } else {
      // Redirigir primero al módulo de viajes
      this.router.navigate(['/viajes']);
    }
  }

  goToProfile() {
    this.router.navigate(['/perfil']);
  }

  goToNotificaciones() {
    this.router.navigate(['/notificaciones']);
    this.nuevasNotificaciones = false;
  }
}
