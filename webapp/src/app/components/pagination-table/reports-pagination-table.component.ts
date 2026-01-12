import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PaginateTableBaseComponent } from './base-pagination-table.component';

@Component({
    standalone: false,
    selector: 'reports-pagination-table',
    templateUrl: './base-pagination-table.component.html',
    styleUrls: ['./base-pagination-table.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsPaginationTableComponent extends PaginateTableBaseComponent<any> {
  constructor() {
    super();
  }
}
