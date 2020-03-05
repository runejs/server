import { runGameServer } from './game-server';
import { runWebServer } from './web-server';
import 'source-map-support/register';
// import { dumpItems } from '@server/data-dump';

runGameServer();
runWebServer();
// dumpItems();
