(* N-body simulation, after the Computer Language Benchmarks Game. *)
let pi = 3.141592653589793
let solar_mass = 4. *. pi *. pi

type body = { mutable x : float; mutable y : float; mutable z : float; mutable vx : float; mutable vy : float; mutable vz : float; mass : float }
type instance = body array
type result = float * float

let steps = ref 1000000
let setup args = if Array.length args > 0 then steps := int_of_string args.(0)

let decode s =
  let f i = Int64.float_of_bits (String.get_int64_le s (8 * i)) in
  Array.init 5 (fun b -> { x = f (7 * b); y = f ((7 * b) + 1); z = f ((7 * b) + 2); vx = f ((7 * b) + 3); vy = f ((7 * b) + 4); vz = f ((7 * b) + 5); mass = f ((7 * b) + 6) })

let energy bodies =
  let nb = Array.length bodies in
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

let advance bodies dt =
  let nb = Array.length bodies in
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

let solve (bodies : instance) : result =
  let px = ref 0. and py = ref 0. and pz = ref 0. in
  Array.iter (fun b -> px := !px +. (b.vx *. b.mass); py := !py +. (b.vy *. b.mass); pz := !pz +. (b.vz *. b.mass)) bodies;
  bodies.(0).vx <- -. !px /. solar_mass;
  bodies.(0).vy <- -. !py /. solar_mass;
  bodies.(0).vz <- -. !pz /. solar_mass;
  let e0 = energy bodies in
  for _ = 1 to !steps do advance bodies 0.01 done;
  (e0, energy bodies)

let emit ((e0, e1) : result) sink =
  let w e = int_of_float (Float.floor ((e *. 1e9) +. 0.5)) in
  sink (w e0); sink (w e1)
