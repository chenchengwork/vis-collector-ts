import PixiOverlay, { PIXI} from './PixiOverlay';

export { PIXI }

export const getPixiOverlay = (drawCallback, pixiContainer, options) => new PixiOverlay(drawCallback, pixiContainer, options);
