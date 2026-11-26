import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MerchantApplication } from '../../../core/models/application.model';
import { InfoCardComponent } from '../../../shared/components/info-card/info-card.component';
import { SensitiveRevealComponent } from '../../../shared/components/sensitive-reveal/sensitive-reveal.component';

@Component({
  selector: 'app-application-profile',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule, InfoCardComponent, SensitiveRevealComponent],
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
  `,
  template: `
    <app-info-card title="Business Profile">
      <div class="row g-3">
        <div class="col-6">
          <div class="text-muted">Registered Name</div>
          <div class="fw-semibold text-dark">{{ application().businessProfile.legalName }}</div>
        </div>
        <div class="col-6">
          <div class="text-muted">Brand / DBA Name</div>
          <div class="fw-semibold text-dark">{{ application().businessProfile.dbaName || 'None' }}</div>
        </div>
        <div class="col-6">
          <div class="text-muted">Entity Structure</div>
          <div class="fw-semibold text-dark">{{ application().businessProfile.businessType }}</div>
        </div>
        <div class="col-6">
          <div class="text-muted">IRD PAN Number (स्थायी लेखा नम्बर)</div>
          <app-sensitive-reveal [rawValue]="application().businessProfile.pan || application().businessProfile.ein"
            fieldType="PAN" fieldName="Permanent Account Number (PAN)"
            [allowContextualReveal]="canRevealSensitiveData()" />
        </div>
      </div>
    </app-info-card>

    <app-info-card title="Beneficial Owner & KYC">
      <div class="row g-3">
        <div class="col-6">
          <div class="text-muted">Principal Director</div>
          <div class="fw-semibold text-dark">{{ application().principalProfile.fullName }}</div>
        </div>
        <div class="col-6">
          <div class="text-muted">Equity Share (%)</div>
          <div class="fw-semibold text-dark">{{ application().principalProfile.ownershipPercentage }}%</div>
        </div>
        <div class="col-12">
          <div class="text-muted">Citizenship No. (नागરિકता नं) / National ID</div>
          <app-sensitive-reveal
            [rawValue]="application().principalProfile.citizenshipNumber || application().principalProfile.ssn"
            fieldType="CITIZENSHIP" fieldName="Citizenship Certificate No."
            [allowContextualReveal]="canRevealSensitiveData()" />
        </div>
      </div>
    </app-info-card>

    <app-info-card title="Processing Limits & NCHL Settlement">
      <div class="row g-3">
        <div class="col-4">
          <div class="text-muted">Monthly Volume</div>
          <div class="h6 fw-bold text-dark mb-0">
            रू {{ application().processingProfile.estimatedMonthlyVolume | number }}
          </div>
        </div>
        <div class="col-4">
          <div class="text-muted">Avg Ticket</div>
          <div class="h6 fw-bold text-dark mb-0">{{ application().processingProfile.averageTicketSize }}</div>
        </div>
        <div class="col-4">
          <div class="text-muted">High Ticket</div>
          <div class="h6 fw-bold text-dark mb-0">{{ application().processingProfile.highTicketSize }}</div>
        </div>
        <div class="col-6">
          <div class="text-muted">Settlement Bank</div>
          <div class="fw-semibold text-dark">{{ application().processingProfile.bankName }}</div>
        </div>
        <div class="col-6">
          <div class="text-muted">NCHL Routing Code</div>
          <div class="font-monospace fw-semibold text-dark">
            {{ application().processingProfile.bankRoutingNumber }}
          </div>
        </div>
        <div class="col-12">
          <div class="text-muted">Bank Account Number (खाता नं)</div>
          <app-sensitive-reveal [rawValue]="application().processingProfile.bankAccountNumber"
            fieldType="BANK_ACCOUNT" fieldName="Commercial Bank Account Number"
            [allowContextualReveal]="canRevealSensitiveData()" />
        </div>
      </div>
    </app-info-card>

    <app-info-card title="Nepal Rastra Bank (NRB) Attestation">
      <div class="row g-3">
        <div class="col-6">
          <div class="text-muted">Regulatory Terms Status</div>
          <div class="text-success fw-semibold">
            <mat-icon style="font-size: 16px; width: 16px; height: 16px; vertical-align: text-bottom;">
              check_circle
            </mat-icon>
            Attested & Accepted
          </div>
        </div>
        <div class="col-6">
          <div class="text-muted">Authorized Signatory</div>
          <div class="fw-semibold text-dark">{{ application().complianceRisk.signerFullName }}</div>
        </div>
      </div>
    </app-info-card>
  `,
})
export class ApplicationProfileComponent {
  readonly application = input.required<MerchantApplication>();
  readonly canRevealSensitiveData = input(false);
}
