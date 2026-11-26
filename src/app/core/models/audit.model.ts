export interface SecurityAuditEvent {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  action:
    | 'SENSITIVE_FIELD_REVEAL'
    | 'SENSITIVE_FIELD_REVEAL_DENIED'
    | 'TOKEN_REFRESH_CONCURRENT'
    | 'TOKEN_REFRESH_SUCCESS'
    | 'ROLE_SWITCH'
    | 'LOGIN_SUCCESS'
    | 'LOGOUT';
  details: string;
  applicationId?: string;
  fieldName?: string;
}
