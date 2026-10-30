// Registration order is priority order: for a whole value the first detector
// that claims it wins, and for overlapping equal-length matches in freeform
// text the earlier detector wins. Specific formats go before ambiguous ones.

// Key-named credentials first: `password: 'a@b.com'` must be redacted, not
// partially masked as an email.
import './secret/secret-key';

// Prefixed secrets — unambiguous formats
import './secret/jwt';
import './secret/bcrypt-hash';
import './secret/aws-key';
import './secret/github-pat';
import './secret/platform-token';

// Contact
import './contact/email';

// Financial — before gov IDs, so a 16-digit card is never labelled a NIK
import './financial/credit-card';
import './financial/iban';

// Gov ID detectors
import './gov-id/ssn-us';
import './gov-id/sin-ca';
import './gov-id/cpf-br';
import './gov-id/nin-uk';
import './gov-id/pan-in';
import './gov-id/aadhaar-in';
import './gov-id/said-za';
import './gov-id/nik-id';
import './gov-id/nin-ng';
import './gov-id/bvn-ng';
import './gov-id/passport';

// Phone — after the formatted IDs it could otherwise shadow
import './contact/phone';

// Network detectors
import './network/ip-address';
import './network/ipv6';
import './network/mac-address';

// Identity detectors
import './identity/uuid';
import './identity/mongodb-objectid';
import './identity/vin';

// Biometric detectors
import './biometric/dob';

// Generic hex secrets — after ObjectId/UUID
import './secret/hex-secret';

// Key-name heuristics last: a value with a recognisable format (an email
// under `name`) is better described by its format detector.
import './identity/person-name';
import './identity/address';
