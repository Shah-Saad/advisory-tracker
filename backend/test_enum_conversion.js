const EntryLockingService = require('./src/services/EntryLockingService');

console.log('Testing enum conversion:');
console.log('true ->', EntryLockingService.convertBooleanToEnum(true));
console.log('false ->', EntryLockingService.convertBooleanToEnum(false));
console.log('"true" ->', EntryLockingService.convertBooleanToEnum('true'));
console.log('"false" ->', EntryLockingService.convertBooleanToEnum('false'));
console.log('undefined ->', EntryLockingService.convertBooleanToEnum(undefined));
console.log('null ->', EntryLockingService.convertBooleanToEnum(null));
console.log('"Y" ->', EntryLockingService.convertBooleanToEnum('Y'));
console.log('"N" ->', EntryLockingService.convertBooleanToEnum('N'));
