let () =
  let n = int_of_string Sys.argv.(1) in
  let perm1 = Array.init n (fun i -> i) in
  let perm = Array.make n 0 in
  let count = Array.make n 0 in
  let maxflips = ref 0 and permcount = ref 0 and checksum = ref 0 in
  let r = ref n in
  while true do
    while !r <> 1 do
      count.(!r - 1) <- !r;
      decr r
    done;
    Array.blit perm1 0 perm 0 n;
    let flips = ref 0 in
    let k = ref perm.(0) in
    while !k <> 0 do
      let i = ref 0 and j = ref !k in
      while !i < !j do
        let t = perm.(!i) in
        perm.(!i) <- perm.(!j);
        perm.(!j) <- t;
        incr i;
        decr j
      done;
      incr flips;
      k := perm.(0)
    done;
    if !flips > !maxflips then maxflips := !flips;
    checksum := !checksum + (if !permcount mod 2 = 0 then !flips else - !flips);
    let continue = ref true in
    while !continue do
      if !r = n then begin
        Printf.printf "checksum=%d\nmaxflips=%d\n" !checksum !maxflips;
        exit 0
      end;
      let p0 = perm1.(0) in
      for i = 0 to !r - 1 do
        perm1.(i) <- perm1.(i + 1)
      done;
      perm1.(!r) <- p0;
      count.(!r) <- count.(!r) - 1;
      if count.(!r) > 0 then continue := false else incr r
    done;
    incr permcount
  done
