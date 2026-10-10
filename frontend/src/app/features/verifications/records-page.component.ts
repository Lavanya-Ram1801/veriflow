import { Component } from '@angular/core';
import { RecordsTableComponent } from './records-table.component';
@Component({ selector: 'vf-records-page', standalone: true, imports: [RecordsTableComponent], template: `<h1>Verifications</h1><vf-records-table />` })
export class RecordsPageComponent {}
