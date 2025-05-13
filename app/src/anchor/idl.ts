/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/readium_fun.json`.
 */
export type ReadiumFun = {
  "address": "EynuKneQ6RX5AAUY8E6Lq6WvNrUVY2F3C8TcFNB7MYh8",
  "metadata": {
    "name": "readiumFun",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "createTale",
      "discriminator": [
        97,
        241,
        193,
        26,
        247,
        45,
        207,
        73
      ],
      "accounts": [
        {
          "name": "taleAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  97,
                  108,
                  101
                ]
              },
              {
                "kind": "arg",
                "path": "taleId"
              }
            ]
          }
        },
        {
          "name": "author",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "taleId",
          "type": "string"
        },
        {
          "name": "title",
          "type": "string"
        },
        {
          "name": "contentCid",
          "type": "string"
        },
        {
          "name": "genre",
          "type": "string"
        },
        {
          "name": "coverImageCid",
          "type": "string"
        },
        {
          "name": "initialStatus",
          "type": "u8"
        }
      ]
    },
    {
      "name": "deleteTale",
      "discriminator": [
        86,
        32,
        28,
        147,
        75,
        234,
        169,
        161
      ],
      "accounts": [
        {
          "name": "taleAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  97,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "tale_account.tale_id",
                "account": "tale"
              }
            ]
          }
        },
        {
          "name": "author",
          "writable": true,
          "signer": true,
          "relations": [
            "taleAccount"
          ]
        }
      ],
      "args": []
    },
    {
      "name": "updateTale",
      "discriminator": [
        168,
        83,
        72,
        113,
        172,
        101,
        87,
        217
      ],
      "accounts": [
        {
          "name": "taleAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  97,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "tale_account.tale_id",
                "account": "tale"
              }
            ]
          }
        },
        {
          "name": "author",
          "writable": true,
          "signer": true,
          "relations": [
            "taleAccount"
          ]
        }
      ],
      "args": [
        {
          "name": "newTitle",
          "type": "string"
        },
        {
          "name": "newContentCid",
          "type": "string"
        },
        {
          "name": "newGenre",
          "type": "string"
        },
        {
          "name": "newCoverImageCid",
          "type": "string"
        },
        {
          "name": "newStatus",
          "type": "u8"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "tale",
      "discriminator": [
        109,
        239,
        69,
        41,
        35,
        229,
        44,
        219
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "titleTooLong",
      "msg": "Title is too long."
    },
    {
      "code": 6001,
      "name": "contentCidTooLong",
      "msg": "Content CID is too long."
    },
    {
      "code": 6002,
      "name": "genreTooLong",
      "msg": "Genre is too long."
    },
    {
      "code": 6003,
      "name": "coverImageCidTooLong",
      "msg": "Cover image CID is too long."
    },
    {
      "code": 6004,
      "name": "unauthorized",
      "msg": "Unauthorized action."
    },
    {
      "code": 6005,
      "name": "invalidStatus",
      "msg": "Invalid status value."
    },
    {
      "code": 6006,
      "name": "talePublished",
      "msg": "Tale is already published and cannot be modified in this way."
    },
    {
      "code": 6007,
      "name": "cannotDeletePublished",
      "msg": "Cannot delete a published tale directly. Set to archived first."
    }
  ],
  "types": [
    {
      "name": "tale",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "author",
            "type": "pubkey"
          },
          {
            "name": "taleId",
            "type": "string"
          },
          {
            "name": "title",
            "type": "string"
          },
          {
            "name": "contentCid",
            "type": "string"
          },
          {
            "name": "genre",
            "type": "string"
          },
          {
            "name": "coverImageCid",
            "type": "string"
          },
          {
            "name": "status",
            "type": "u8"
          },
          {
            "name": "timestamp",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ]
};
