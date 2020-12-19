import { Player } from '@server/world/actor/player/player';
import { Position } from '@server/world/position';


/**
 * Various camera options for cutscenes.
 */
export interface CameraOptions {
    cameraX?: number;
    cameraY?: number;
    cameraHeight?: number;
    cameraMovementSpeed?: number;
    cameraAcceleration?: number;
    lookX?: number;
    lookY?: number;
    lookHeight?: number;
    lookMovementSpeed?: number;
    lookAcceleration?: number;
}


/**
 * Controls a game cutscene for a specific player.
 */
export class Cutscene {

    public readonly player: Player;
    private _cameraX: number;
    private _cameraY: number;
    private _cameraHeight: number;
    private _cameraMovementSpeed: number;
    private _cameraAcceleration: number;
    private _lookX: number;
    private _lookY: number;
    private _lookHeight: number;
    private _lookMovementSpeed: number;
    private _lookAcceleration: number;

    public constructor(player: Player, options?: CameraOptions) {
        this.player = player;

        if(options) {
            this.setCamera(options);
        }
    }

    /**
     * Sets the cutscene camera to the specified options.
     * @param options The camera options to use.
     */
    public setCamera(options: CameraOptions): void {
        const { cameraX, cameraY, cameraHeight, cameraMovementSpeed, cameraAcceleration,
            lookX, lookY, lookHeight, lookMovementSpeed, lookAcceleration } = options;

        if(cameraX && cameraY) {
            this.snapCameraTo(cameraX, cameraY, cameraHeight || 400,
                cameraMovementSpeed || 0,  cameraAcceleration || 100);
        }
        if(lookX && lookY) {
            this.lookAt(lookX, lookY, lookHeight || 400,
                lookMovementSpeed || 0,  lookAcceleration || 100);
        }
    }

    /**
     * Snaps the cutscene to a specific location.
     * @param cameraX The world X coordinate to snap the camera to.
     * @param cameraY The world Y coordinate to snap the camera to.
     * @param height The height of the camera relative to the ground. Defaults to 400.
     * @param movementSpeed The general speed of the camera movement. Defaults to 0 (immediate).
     * @param acceleration The acceleration speed of the camera movement. Defaults to 100 (instantaneous).
     */
    public snapCameraTo(cameraX: number, cameraY: number, height: number = 400, movementSpeed: number = 0,
        acceleration: number = 100): void {
        this._cameraX = cameraX;
        this._cameraY = cameraY;
        this._cameraHeight = height;
        this._cameraMovementSpeed = movementSpeed;
        this._cameraAcceleration = acceleration;
        this.player.outgoingPackets.snapCameraTo(new Position(cameraX, cameraY), height, movementSpeed, acceleration);
    }

    /**
     * Makes the camera look at a specific location from it's current snap point.
     * @param lookX The world X coordinate to look towards.
     * @param lookY The world Y coordinate to look towards.
     * @param height The height that the camera should be looking at, relative to the ground. Defaults to 400.
     * @param movementSpeed The general speed of the camera movement. Defaults to 0 (immediate).
     * @param acceleration The acceleration speed of the camera movement. Defaults to 100 (instantaneous).
     */
    public lookAt(lookX: number, lookY: number, height: number = 400, movementSpeed: number = 0,
        acceleration: number = 100): void {
        this._lookX = lookX;
        this._lookY = lookY;
        this._lookHeight = height;
        this._lookMovementSpeed = movementSpeed;
        this._lookAcceleration = acceleration;
        this.player.outgoingPackets.turnCameraTowards(new Position(lookX, lookY), height, movementSpeed, acceleration);
    }

    /**
     * Ends the current cutscene and snaps the camera back to the player character.
     */
    public endCutscene(): void {
        this.player.outgoingPackets.resetCamera();
        this.player.cutscene = null;
    }


    public get cameraX(): number {
        return this._cameraX;
    }

    public get cameraY(): number {
        return this._cameraY;
    }

    public get cameraHeight(): number {
        return this._cameraHeight;
    }

    public get cameraMovementSpeed(): number {
        return this._cameraMovementSpeed;
    }

    public get cameraAcceleration(): number {
        return this._cameraAcceleration;
    }

    public get lookX(): number {
        return this._lookX;
    }

    public get lookY(): number {
        return this._lookY;
    }

    public get lookHeight(): number {
        return this._lookHeight;
    }

    public get lookMovementSpeed(): number {
        return this._lookMovementSpeed;
    }

    public get lookAcceleration(): number {
        return this._lookAcceleration;
    }
}
