import { quadtree, Quadtree, QuadtreeLeaf } from 'd3-quadtree';

interface Circle {
    x0: number;
    y0: number;


    currentX?: number;
    currentY?: number;
    targetX?: number;
    targetY?: number;
    currentScale?: number;
    targetScale?: number;
    xp?: number;
    yp?: number;
    r?: number;
    r0?: number;
    xMin?: number;
    xMax?: number;
    yMin?: number;
    yMax?: number;
}

interface Opts {
    r0: number;
    zoom: number;
    extent?:[[number, number], [number, number]];
}

/**
 * 生成碰撞检测数据集
 * @param circles
 * @param opts
 */
export const solveCollision = function(circles: Circle[], opts: Opts) {
    // opts = opts || {};
    const tree: Quadtree<Circle[]> = quadtree()
        .x((d) => d.xp)
        .y((d) => d.yp);

    if (opts.extent !== undefined) tree.extent(opts.extent);
    let rMax = 0;

    circles.forEach((circle) => {
        circle.xp = circle.x0;
        circle.yp = circle.y0;
        if (opts.r0 !== undefined) circle.r0 = opts.r0;
        circle.r = circle.r0;
        circle.xMin = circle.x0 - circle.r0;
        circle.xMax = circle.x0 + circle.r0;
        circle.yMin = circle.y0 - circle.r0;
        circle.yMax = circle.y0 + circle.r0;

        const collide = (d: Circle) =>{
            const fixCollision = (node: Circle) => {
                const x = d.xp - node.xp;
                const y = d.yp - node.yp;
                const l = x * x + y * y;
                const r = d.r + node.r;

                if (l < r * r) {
                    let c1, c2, lambda1, lambda2, u1, u2;
                    const delta = Math.sqrt(l);
                    if (d.r < node.r) {
                        c1 = node; c2 = d;
                    } else {
                        c1 = d; c2 = node;
                    }
                    let r1 = c1.r;
                    let r2 = c2.r;
                    let alpha = (r1 + r2 + delta) / 4;
                    if (l > 0) {
                        u1 = (c2.xp - c1.xp) / delta;
                        u2 = (c2.yp - c1.yp) / delta;
                    } else {
                        let theta = 2 * Math.PI * Math.random();
                        u1 = Math.cos(theta);
                        u2 = Math.sin(theta);
                    }

                    if (r2 >= alpha) {
                        lambda1 = alpha / r1;
                        lambda2 = alpha / r2;
                    } else {
                        lambda1 = (r1 - r2 + delta) / (2 * r1);
                        if (lambda1 > 1) console.log(lambda1);
                        lambda2 = 1;
                    }
                    c1.r *= lambda1;
                    c2.r *= lambda2;
                    c1.xp += (lambda1 - 1) * r1 * u1;
                    c1.yp += (lambda1 - 1) * r1 * u2;
                    c2.xp += (1 - lambda2) * r2 * u1;
                    c2.yp += (1 - lambda2) * r2 * u2;
                    c1.xMin = c1.xp - c1.r;
                    c1.xMax = c1.xp + c1.r;
                    c1.yMin = c1.yp - c1.r;
                    c1.yMax = c1.yp + c1.r;
                    c2.xMin = c2.xp - c2.r;
                    c2.xMax = c2.xp + c2.r;
                    c2.yMin = c2.yp - c2.r;
                    c2.yMax = c2.yp + c2.r;
                }
            };

            return (quad: QuadtreeLeaf<Circle>, x1: number, y1: number, x2: number, y2: number) => {
                if (!quad.length) {
                    do {
                        if (quad.data != d && d.xMax > quad.data.xMin && d.xMin < quad.data.xMax && d.yMax > quad.data.yMin && d.yMin < quad.data.yMax) {
                            fixCollision(quad.data);
                        }
                    } while (quad = quad.next)
                }
                return x1 > d.xMax + rMax || x2 + rMax < d.xMin || y1 > d.yMax + rMax || y2 + rMax < d.yMin;
            }
        }

        tree.visit(collide(circle));
        rMax = Math.max(rMax, circle.r);
        tree.add(circle);
    });

    if (opts.zoom !== undefined) {
        circles.forEach((circle) => {
            circle.cache = circle.cache || {};
            circle.cache[opts.zoom] = {
                x: circle.xp,
                y: circle.yp,
                r: circle.r
            };
        });
    }
    const ret = quadtree()
        .x((d) => d.xp)
        .y((d) => d.yp);
    let rMax2 = 0;
    circles.forEach((circle) => {
        ret.add(circle);
        rMax2 = Math.max(rMax2, circle.r);
    });

    ret.rMax = rMax2;

    return ret;
}
