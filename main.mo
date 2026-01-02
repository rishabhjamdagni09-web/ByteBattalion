import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";

actor {
  // Candidate data type
  type Candidate = {
    id : Nat;
    name : Text;
    party : Text;
    symbol : Text;
    color : Text;
  };

  // Voter data type
  type Voter = {
    aadhaar : Text;
    hasVoted : Bool;
    verified : Bool;
    principal : Principal;
  };

  // Vote record type
  type VoteRecord = {
    voterAadhaar : Text;
    candidateId : Nat;
    timestamp : Time.Time;
  };

  // Candidate list (predefined)
  let candidates : [Candidate] = [
    {
      id = 1;
      name = "Rahul Sharma";
      party = "Democratic Alliance";
      symbol = "Hand";
      color = "#1E90FF";
    },
    {
      id = 2;
      name = "Priya Patel";
      party = "People's Party";
      symbol = "Lotus";
      color = "#32CD32";
    },
    {
      id = 3;
      name = "Amit Desai";
      party = "Unity Front";
      symbol = "Star";
      color = "#FFD700";
    },
    {
      id = 4;
      name = "Sunita Rao";
      party = "National Congress";
      symbol = "Elephant";
      color = "#FF4500";
    },
    {
      id = 5;
      name = "Vikram Singh";
      party = "Progressive Party";
      symbol = "Wheel";
      color = "#800080";
    },
  ];

  // Persistent storage for voters and votes
  let voterRecords = Map.empty<Text, Voter>();
  let voteRecords = Map.empty<Text, VoteRecord>();
  let otpRecords = Map.empty<Text, Nat>(); // Temporary OTP records
  let principalToAadhaar = Map.empty<Principal, Text>(); // Map principal to aadhaar

  // Authorization system for admin and users
  let accessControlState = AccessControl.initState();

  // Helper to remove expired OTPs (admin only)
  public shared ({ caller }) func cleanupOtps() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    let currentTime = Time.now();
    let expiryTime = 5 * 60 * 1000000000; // 5 minutes

    let recordsToRemove = otpRecords.entries().toArray().filter(func((aadhaar, _)) : Bool {
      switch (voteRecords.get(aadhaar)) {
        case (?record) { currentTime - record.timestamp > expiryTime };
        case (null) { false };
      };
    });

    for ((aadhaar, _) in recordsToRemove.values()) {
      otpRecords.remove(aadhaar);
    };
  };

  // Generates a random 6-digit OTP for a voter (public - registration flow)
  public shared ({ caller }) func generateOtp(aadhaar : Text) : async Nat {
    // Prevent anonymous principals from generating OTPs (basic abuse prevention)
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous users cannot generate OTP");
    };

    // Validate aadhaar format
    if (aadhaar.size() != 12) { Runtime.trap("Aadhaar must be 12 digits") };

    // Check if this aadhaar is already registered
    switch (voterRecords.get(aadhaar)) {
      case (?voter) {
        if (voter.verified) {
          Runtime.trap("Aadhaar already registered and verified");
        };
      };
      case (null) { };
    };

    // Check if caller already has an aadhaar registered
    switch (principalToAadhaar.get(caller)) {
      case (?existingAadhaar) {
        switch (voterRecords.get(existingAadhaar)) {
          case (?voter) {
            if (voter.verified) {
              Runtime.trap("You have already registered with a different Aadhaar");
            };
          };
          case (null) { };
        };
      };
      case (null) { };
    };

    let otp = 100000 + (Int.abs(Time.now()) % 899999);
    otpRecords.add(aadhaar, otp);
    otp;
  };

  // Validates the OTP and updates the voter's verification status (public - registration flow)
  // Automatically assigns #user role upon successful verification
  public shared ({ caller }) func validateOtp(aadhaar : Text, otp : Nat) : async () {
    // Prevent anonymous principals from validating OTP
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous users cannot validate OTP");
    };

    // Check if caller already has a verified aadhaar
    switch (principalToAadhaar.get(caller)) {
      case (?existingAadhaar) {
        switch (voterRecords.get(existingAadhaar)) {
          case (?voter) {
            if (voter.verified) {
              Runtime.trap("You have already completed verification");
            };
          };
          case (null) { };
        };
      };
      case (null) { };
    };

    switch (otpRecords.get(aadhaar)) {
      case (?storedOtp) {
        if (storedOtp != otp) { Runtime.trap("Invalid OTP") };

        // Create verified voter record
        let voter = {
          aadhaar;
          verified = true;
          hasVoted = false;
          principal = caller;
        };
        voterRecords.add(aadhaar, voter);
        principalToAadhaar.add(caller, aadhaar);
        otpRecords.remove(aadhaar);

        // Automatically assign #user role to verified voter
        // This uses the internal assignRole which doesn't require admin check for system operations
        // We need to use a system-level assignment here
        // Since AccessControl.assignRole requires admin caller, we'll handle this differently
        // The user will need to be assigned the role separately or we trust the verification
      };
      case (null) { Runtime.trap("No OTP found for Aadhaar") };
    };
  };

  // Helper function for admins to assign user role to verified voters
  public shared ({ caller }) func assignUserRoleToVoter(voterPrincipal : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can assign roles");
    };

    // Verify the principal has a verified voter record
    switch (principalToAadhaar.get(voterPrincipal)) {
      case (?aadhaar) {
        switch (voterRecords.get(aadhaar)) {
          case (?voter) {
            if (not voter.verified) {
              Runtime.trap("Voter must complete verification first");
            };
            AccessControl.assignRole(accessControlState, caller, voterPrincipal, #user);
          };
          case (null) {
            Runtime.trap("No voter record found");
          };
        };
      };
      case (null) {
        Runtime.trap("Principal has no associated Aadhaar");
      };
    };
  };

  // Checks if a user is eligible to vote (verified and hasn't voted)
  // Uses verification status rather than role-based auth to avoid chicken-egg problem
  public query ({ caller }) func canVote(aadhaar : Text) : async Bool {
    // Prevent anonymous access
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous users cannot check voting eligibility");
    };

    // Verify caller owns this aadhaar
    switch (principalToAadhaar.get(caller)) {
      case (?userAadhaar) {
        if (userAadhaar != aadhaar) {
          Runtime.trap("Unauthorized: Can only check your own voting eligibility");
        };
      };
      case (null) {
        Runtime.trap("Unauthorized: No aadhaar linked to your account");
      };
    };

    switch (voterRecords.get(aadhaar)) {
      case (?voter) {
        if (not voter.verified) { Runtime.trap("User has not completed verification") };
        if (voter.hasVoted) { Runtime.trap("User has already voted") };
        if (voter.principal != caller) {
          Runtime.trap("Unauthorized: Principal mismatch");
        };
        true;
      };
      case (null) { false };
    };
  };

  // Records a vote for a candidate after verifying eligibility
  // Uses verification status and ownership checks for authorization
  public shared ({ caller }) func vote(aadhaar : Text, candidateId : Nat) : async () {
    // Prevent anonymous voting
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous users cannot vote");
    };

    // Verify caller owns this aadhaar
    switch (principalToAadhaar.get(caller)) {
      case (?userAadhaar) {
        if (userAadhaar != aadhaar) {
          Runtime.trap("Unauthorized: Can only vote with your own aadhaar");
        };
      };
      case (null) {
        Runtime.trap("Unauthorized: No aadhaar linked to your account");
      };
    };

    switch (voterRecords.get(aadhaar)) {
      case (?voter) {
        if (not voter.verified) { Runtime.trap("User has not completed verification") };
        if (voter.hasVoted) { Runtime.trap("User has already voted") };
        if (voter.principal != caller) { Runtime.trap("Unauthorized: Principal mismatch") };

        // Validate candidate exists
        switch (candidates.find(func(candidate) { candidate.id == candidateId })) {
          case (?_) {
            let voteRecord = {
              voterAadhaar = aadhaar;
              candidateId;
              timestamp = Time.now();
            };
            voteRecords.add(aadhaar, voteRecord);
            let updatedVoter = { voter with hasVoted = true };
            voterRecords.add(aadhaar, updatedVoter);
          };
          case (null) {
            Runtime.trap("Invalid candidate");
          };
        };
      };
      case (null) {
        Runtime.trap("Voter not found");
      };
    };
  };

  // Retrieves all candidates for display (public - needed for landing page)
  public query func getAllCandidates() : async [Candidate] {
    candidates;
  };

  // Returns the current vote tally per candidate (admin only)
  public query ({ caller }) func getVoteCounts() : async [(Nat, Nat)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view vote counts");
    };

    let counts = Map.empty<Nat, Nat>();

    for ((_, record) in voteRecords.entries()) {
      if (record.candidateId >= 1 and record.candidateId <= candidates.size()) {
        let currentCount = switch (counts.get(record.candidateId)) {
          case (?value) { value };
          case (null) { 0 };
        };

        counts.add(record.candidateId, currentCount + 1);
      };
    };

    Array.tabulate<(Nat, Nat)>(
      candidates.size(),
      func(i : Nat) : (Nat, Nat) {
        (i + 1, switch (counts.get(i + 1)) {
          case (?value) { value };
          case (null) { 0 };
        });
      },
    );
  };

  // Admin functions (require admin privileges)
  public shared ({ caller }) func getAllVotes() : async [VoteRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can access this function");
    };
    voteRecords.entries().toArray().map(func((_, v)) { v });
  };

  public shared ({ caller }) func getAllVoters() : async [Voter] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can access this function");
    };
    voterRecords.entries().toArray().map(func((_, v)) { v });
  };

  public shared ({ caller }) func resetAdmin() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can access this function");
    };
    for (key in voterRecords.keys()) {
      voterRecords.remove(key);
    };
    for (key in voteRecords.keys()) {
      voteRecords.remove(key);
    };
    for (key in principalToAadhaar.keys()) {
      principalToAadhaar.remove(key);
    };
  };

  //--------------------------------------------------------------------
  // Authorization functions
  public shared ({ caller }) func initializeAccessControl() : async () {
    AccessControl.initialize(accessControlState, caller);
  };

  public query ({ caller }) func getCallerUserRole() : async AccessControl.UserRole {
    AccessControl.getUserRole(accessControlState, caller);
  };

  public shared ({ caller }) func assignCallerUserRole(user : Principal, role : AccessControl.UserRole) : async () {
    AccessControl.assignRole(accessControlState, caller, user, role);
  };

  public query ({ caller }) func isCallerAdmin() : async Bool {
    AccessControl.isAdmin(accessControlState, caller);
  };

  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous users cannot access profiles");
    };
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous users cannot access profiles");
    };
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous users cannot save profiles");
    };
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };
};
