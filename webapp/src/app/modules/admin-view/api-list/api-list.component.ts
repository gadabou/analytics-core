import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ApiTokenAccess } from '@kossi-models/api-token';
import { ApiService } from '@kossi-services/api.service';

@Component({
  standalone: false,
  selector: 'app-admin-api',
  templateUrl: './api-list.component.html',
  styleUrls: ['./api-list.component.css']
})
export class ApiComponent implements OnInit {
  apis$: ApiTokenAccess[] = [];
  apiForm!: FormGroup;
  apiAction: string = '';
  isEditMode: boolean = false;
  selectedApi!: ApiTokenAccess | null;
  message: string = '';

  tokenLenMin: number = 0;
  tokenLenMax: number = 30;

  showModalFlag: boolean = false;
  showDeleteModalFlag: boolean = false;

  isActiving: boolean = false;
  loading: boolean = false;

  constructor(private api: ApiService) { }

  ngOnInit(): void {
    this.GetApis();
    this.apiForm = this.createFormGroup();
  }

  openModal(action: 'create' | 'refresh' | 'delete', api?: ApiTokenAccess) {
    this.message = '';
    this.apiAction = action ?? ''
    this.selectedApi = api ?? null;
    this.apiForm = this.createFormGroup();
    this.isEditMode = action === 'refresh';

    if (['create', 'refresh'].includes(action)) {
      this.showModalFlag = true;
    } else if (action === 'delete' && api) {
      this.showDeleteModalFlag = true;
    }
  }

  closeModal() {
    this.showModalFlag = false;
    this.showDeleteModalFlag = false;
  }

  createFormGroup(api?: ApiTokenAccess): FormGroup {
    return new FormGroup({
      tokenLen: new FormControl(api?.tokenLen || 10, [Validators.required]),
      isActive: new FormControl(api?.isActive || false)
    });
  }

  GetApis() {
    this.api.ApiTokenAccessAction({ action: 'list' }).subscribe((res: any) => {
      if (res.status === 200) this.apis$ = res.data;
    });
  }

  CreateOrUpdateApi() {
    if (!this.apiForm.valid) return;

    this.loading = true;
    const { tokenLen, isActive } = this.apiForm.value;

    let request$;
    if (this.isEditMode && this.selectedApi && this.apiAction === 'refresh') {
      request$ = this.api.ApiTokenAccessAction({ action: this.apiAction, id: this.selectedApi.id, tokenLen, isActive });
    } else if (this.apiAction === 'create') {
      request$ = this.api.ApiTokenAccessAction({ action: this.apiAction, tokenLen });
    }

    request$?.subscribe((res: any) => {
      if (res.status === 200) {
        this.GetApis();
        this.closeModal();
      } else {
        this.message = res.data;
      }
      this.loading = false;
    }, (err: any) => {
      this.message = 'Erreur serveur';
      this.loading = false;
    });
  }

  SetActive(api: ApiTokenAccess) {
    this.isActiving = true;
    const params = { action: 'update', id: api.id, isActive: !api.isActive };
    this.api.ApiTokenAccessAction(params).subscribe((res: any) => {
      if (res.status === 200) {
        this.GetApis();
        this.closeModal();
      } else {
        this.message = res.data;
      }
      this.isActiving = false;
    }, (err: any) => {
      this.message = 'Erreur serveur';
      this.isActiving = false;
    });
  }

  DeleteApi() {
    if (!this.selectedApi) return;

    this.api.ApiTokenAccessAction({ action: 'delete', id: this.selectedApi.id }).subscribe((res: any) => {
      if (res.status === 200) {
        this.GetApis();
        this.closeModal();
      } else {
        this.message = res.data;
      }
    }, (err: any) => {
      this.message = 'Erreur serveur';
    });
  }
}
