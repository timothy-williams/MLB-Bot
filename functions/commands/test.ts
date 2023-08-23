// idk how to run this locally yet it just hangs
// Run this file to test stuff locally before committing
require('aws-sdk/lib/maintenance_mode_message').suppress = true;
import { todays_scores } from './todays_scores';

todays_scores();