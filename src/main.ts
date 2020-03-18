import { runGameServer } from './game-server';
import { runWebServer } from './web-server';
import 'source-map-support/register';
import { initErrorHandling } from '@server/error-handling';
// import { dumpItems } from '@server/data-dump';

initErrorHandling();
runGameServer();
runWebServer();
// dumpItems();
