(* N-body simulation, after the Computer Language Benchmarks Game. *)
let pi = 3.141592653589793
let solar_mass = 4. *. pi *. pi
let days = 365.24

type body = { mutable x : float; mutable y : float; mutable z : float; mutable vx : float; mutable vy : float; mutable vz : float; mass : float }

let bodies =
  [|
    { x = 0.; y = 0.; z = 0.; vx = 0.; vy = 0.; vz = 0.; mass = solar_mass };
    { x = 4.84143144246472090e+00; y = -1.16032004402742839e+00; z = -1.03622044471123109e-01;
      vx = 1.66007664274403694e-03 *. days; vy = 7.69901118419740425e-03 *. days; vz = -6.90460016972063023e-05 *. days;
      mass = 9.54791938424326609e-04 *. solar_mass };
    { x = 8.34336671824457987e+00; y = 4.12479856412430479e+00; z = -4.03523417114321381e-01;
      vx = -2.76742510726862411e-03 *. days; vy = 4.99852801234917238e-03 *. days; vz = 2.30417297573763929e-05 *. days;
      mass = 2.85885980666130812e-04 *. solar_mass };
    { x = 1.28943695621391310e+01; y = -1.51111514016986312e+01; z = -2.23307578892655734e-01;
      vx = 2.96460137564761618e-03 *. days; vy = 2.37847173959480950e-03 *. days; vz = -2.96589568540237556e-05 *. days;
      mass = 4.36624404335156298e-05 *. solar_mass };
    { x = 1.53796971148509165e+01; y = -2.59193146099879641e+01; z = 1.79258772950371181e-01;
      vx = 2.68067772490389322e-03 *. days; vy = 1.62824170038242295e-03 *. days; vz = -9.51592254519715870e-05 *. days;
      mass = 5.15138902046611451e-05 *. solar_mass };
  |]

let nb = Array.length bodies

let energy () =
  let e = ref 0. in
  for i = 0 to nb - 1 do
    let b = bodies.(i) in
    e := !e +. (0.5 *. b.mass *. ((b.vx *. b.vx) +. (b.vy *. b.vy) +. (b.vz *. b.vz)));
    for j = i + 1 to nb - 1 do
      let c = bodies.(j) in
      let dx = b.x -. c.x and dy = b.y -. c.y and dz = b.z -. c.z in
      e := !e -. (b.mass *. c.mass /. sqrt ((dx *. dx) +. (dy *. dy) +. (dz *. dz)))
    done
  done;
  !e

let advance dt =
  for i = 0 to nb - 1 do
    let b = bodies.(i) in
    for j = i + 1 to nb - 1 do
      let c = bodies.(j) in
      let dx = b.x -. c.x and dy = b.y -. c.y and dz = b.z -. c.z in
      let d2 = (dx *. dx) +. (dy *. dy) +. (dz *. dz) in
      let mag = dt /. (d2 *. sqrt d2) in
      let bm = b.mass *. mag and cm = c.mass *. mag in
      b.vx <- b.vx -. (dx *. cm); b.vy <- b.vy -. (dy *. cm); b.vz <- b.vz -. (dz *. cm);
      c.vx <- c.vx +. (dx *. bm); c.vy <- c.vy +. (dy *. bm); c.vz <- c.vz +. (dz *. bm)
    done
  done;
  Array.iter
    (fun b ->
      b.x <- b.x +. (dt *. b.vx);
      b.y <- b.y +. (dt *. b.vy);
      b.z <- b.z +. (dt *. b.vz))
    bodies

let () =
  let n = int_of_string Sys.argv.(1) in
  let px = ref 0. and py = ref 0. and pz = ref 0. in
  Array.iter (fun b -> px := !px +. (b.vx *. b.mass); py := !py +. (b.vy *. b.mass); pz := !pz +. (b.vz *. b.mass)) bodies;
  bodies.(0).vx <- -. !px /. solar_mass;
  bodies.(0).vy <- -. !py /. solar_mass;
  bodies.(0).vz <- -. !pz /. solar_mass;
  Printf.printf "%.9f\n" (energy ());
  for _ = 1 to n do advance 0.01 done;
  Printf.printf "%.9f\n" (energy ())
